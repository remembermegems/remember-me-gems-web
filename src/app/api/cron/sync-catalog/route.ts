import { NextRequest, NextResponse } from "next/server";
import { getStones } from "@/lib/notion/stones";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import {
  buildCatalogPlan,
  upsertProduct,
  publishProduct,
  listPublications,
  listManagedProducts,
  archiveProduct,
} from "@/lib/shopify/catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

// Scheduled catalog sync (punch list #25, Anthony's "option 2").
//
// Deliberately a plain authenticated route rather than a Netlify-specific
// scheduled function, so whatever ends up triggering it — Netlify scheduled
// functions, a GitHub Action, cron-job.org — is a deployment detail rather
// than something baked into the code.
//
// The window this closes: restocking a stone in Notion makes it visible on the
// site immediately, but checkout fails for it until Shopify has the product.
// A nightly run means that gap is hours at worst, never permanent.
function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  // Refuse rather than run open to the world if the secret was never set —
  // an unauthenticated endpoint that writes to the live store is worse than
  // no scheduled sync at all.
  if (!expected) return false;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  try {
    const [stones, copy] = await Promise.all([getStones(), getConfiguratorCopy()]);
    const betaMode = copyText(copy, "global_beta_mode", "true") === "true";
    const plan = buildCatalogPlan(stones, betaMode);

    let publicationIds: string[] = [];
    try {
      publicationIds = (await listPublications()).map((p) => p.id);
    } catch {
      // Non-fatal: products still sync, they just may not be published.
    }

    const synced: string[] = [];
    const failed: string[] = [];
    for (const product of plan) {
      try {
        const { id } = await upsertProduct(product);
        await publishProduct(id, publicationIds);
        synced.push(product.sku);
      } catch (err) {
        failed.push(`${product.sku}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const wanted = new Set(plan.map((p) => p.sku));
    const archived: string[] = [];
    try {
      const orphans = (await listManagedProducts()).filter((p) => p.status !== "ARCHIVED" && !wanted.has(p.sku));
      for (const orphan of orphans) {
        try {
          await archiveProduct(orphan.id);
          archived.push(orphan.sku);
        } catch (err) {
          failed.push(`archive ${orphan.sku}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch {
      // Listing failed — skip reconciliation this run rather than fail the sync.
    }

    const result = {
      ok: failed.length === 0,
      betaMode,
      synced: synced.length,
      archived: archived.length,
      failed,
      ms: Date.now() - started,
    };
    console.log("[cron/sync-catalog]", JSON.stringify(result));
    return NextResponse.json(result, { status: failed.length === 0 ? 200 : 207 });
  } catch (err) {
    console.error("[cron/sync-catalog] failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
