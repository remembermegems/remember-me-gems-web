/**
 * One-way sync: Notion stone catalog -> Shopify products.
 *
 *   npx tsx --env-file=.env.local scripts/shopify-sync-catalog.ts          # dry run
 *   npx tsx --env-file=.env.local scripts/shopify-sync-catalog.ts --apply  # write
 *
 * Idempotent: products are upserted by handle via productSet, so re-running
 * after a price change or a new stone updates in place rather than duplicating.
 * Safe to run whenever Notion changes — including after flipping beta mode,
 * which changes every stone's price.
 */
import { getStones } from "../src/lib/notion/stones";
import { getConfiguratorCopy, copyText } from "../src/lib/notion/configuratorCopy";
import {
  buildCatalogPlan,
  upsertProduct,
  publishProduct,
  listPublications,
  listManagedProducts,
  archiveProduct,
} from "../src/lib/shopify/catalog";

async function main() {
  const apply = process.argv.includes("--apply");

  const [stones, copy] = await Promise.all([getStones(), getConfiguratorCopy()]);
  const betaMode = copyText(copy, "global_beta_mode", "true") === "true";
  const plan = buildCatalogPlan(stones, betaMode);

  console.log(`\nPricing mode: ${betaMode ? "BETA" : "LAUNCH"}`);
  console.log(`Stones in Notion: ${stones.length} (${stones.filter((s) => s.availableForSale).length} available for sale)`);
  console.log(`Products to sync: ${plan.length}\n`);

  const stoneRows = plan.filter((p) => p.kind === "stone");
  const addonRows = plan.filter((p) => p.kind === "addon");

  console.log(`--- ${stoneRows.length} stone products ---`);
  for (const p of stoneRows) console.log(`  $${String(p.price).padStart(4)}  ${p.sku.padEnd(38)} ${p.title}`);
  console.log(`\n--- ${addonRows.length} add-on products ---`);
  for (const p of addonRows) console.log(`  $${String(p.price).padStart(4)}  ${p.sku.padEnd(38)} ${p.title}`);

  // Anything we previously created that's no longer in the plan (stone
  // retired or sold out in Notion) has to be archived, or it stays ACTIVE,
  // published and — inventory tracking being off — still purchasable.
  const wantedSkus = new Set(plan.map((p) => p.sku));
  let orphans: { id: string; sku: string; title: string }[] = [];
  try {
    orphans = (await listManagedProducts())
      .filter((p) => p.status !== "ARCHIVED" && !wantedSkus.has(p.sku))
      .map((p) => ({ id: p.id, sku: p.sku, title: p.title }));
  } catch (err) {
    console.log(`\n(could not list existing products: ${err instanceof Error ? err.message : String(err)})`);
  }

  console.log(`\n--- ${orphans.length} to archive (retired / sold out in Notion) ---`);
  for (const o of orphans) console.log(`  archive  ${o.sku.padEnd(38)} ${o.title}`);

  if (!apply) {
    console.log(`\nDRY RUN — nothing written. Re-run with --apply to create these in Shopify.\n`);
    return;
  }

  // Explicit publishing needs the read_publications/write_publications scopes,
  // which this app version doesn't currently have. That's not necessarily
  // fatal — Shopify may already publish new products to the store's default
  // channels — so don't let it block the catalog write. Whether products are
  // actually reachable is settled by querying the Storefront API afterwards,
  // not by assuming either way.
  let publicationIds: string[] = [];
  try {
    const publications = await listPublications();
    console.log(`\nSales channels found: ${publications.map((p) => p.name).join(", ") || "(none)"}`);
    publicationIds = publications.map((p) => p.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`\n! Could not list sales channels — ${msg}`);
    console.log(`  Continuing without explicit publishing; will verify Storefront visibility after the sync.`);
  }

  console.log(`\nWriting ${plan.length} products...\n`);
  let ok = 0;
  const failures: string[] = [];
  for (const product of plan) {
    try {
      const { id } = await upsertProduct(product);
      await publishProduct(id, publicationIds);
      ok += 1;
      console.log(`  ok  ${product.sku}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${product.sku}: ${msg}`);
      console.log(`  FAIL ${product.sku} — ${msg}`);
    }
  }

  for (const orphan of orphans) {
    try {
      await archiveProduct(orphan.id);
      console.log(`  archived  ${orphan.sku}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`archive ${orphan.sku}: ${msg}`);
      console.log(`  FAIL archive ${orphan.sku} — ${msg}`);
    }
  }

  console.log(`\n${ok}/${plan.length} synced, ${orphans.length} archived.`);
  if (failures.length) {
    console.log(`\nFailures:\n${failures.map((f) => `  ${f}`).join("\n")}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
