import { NextRequest, NextResponse } from "next/server";
import { uploadFileToPage } from "@/lib/notion/client";

// Punch list #31 (Notion-snapshot half, not the blocked Shopify-email half):
// takes a gem render captured client-side as a PNG data URL and attaches it
// to the matching order's "Gem Render" property in "RMG Orders & Production"
// — a useful internal visual confirmation, independent of the Shopify
// email-image work that's still blocked on #34.
export async function POST(req: NextRequest) {
  const { pageId, dataUrl } = (await req.json()) as { pageId?: string; dataUrl?: string };

  if (!pageId || !dataUrl?.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Expected { pageId, dataUrl } with a PNG data URL" }, { status: 400 });
  }

  const base64 = dataUrl.slice("data:image/png;base64,".length);
  const buffer = Buffer.from(base64, "base64");

  try {
    await uploadFileToPage(pageId, "Gem Render", buffer, `gem-render-${pageId}.png`, "image/png");
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Best-effort, same spirit as decrementStoneInventory in orders.ts — a
    // failed snapshot upload shouldn't be treated as a failed order. The
    // order itself was already written to Notion before this ever runs.
    console.warn("[orders/snapshot] Failed to upload gem render for", pageId, err);
    return NextResponse.json({ error: "Snapshot upload failed" }, { status: 502 });
  }
}
