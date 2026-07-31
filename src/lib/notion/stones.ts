import { NOTION_DB } from "./config";
import { hasNotionToken, queryAllRows, text, num, multiSelect, checkbox, fileUrl, select, type NotionPage } from "./client";
import type { Stone } from "./types";
import { mockStones } from "@/lib/mock/stones";

function mapRow(page: NotionPage): Stone {
  return {
    id: page.id,
    name: text(page, "Stone Name"),
    betaPrice: num(page, "Beta Price") ?? 0,
    launchPrice: num(page, "Launch Price") ?? 0,
    // Known gap (2026-07-02): Morado Opal's Touchstone Upcharge is unset in Notion.
    // Defaulting to 0 rather than guessing — confirm the real number with Anthony before launch.
    touchstoneUpcharge: num(page, "Touchstone Upcharge") ?? 0,
    grouping: multiSelect(page, "Grouping"),
    colorFamily: select(page, "Color Family"),
    metaphysicalThemes: multiSelect(page, "Metaphysical Themes"),
    metaphysicalProperties: text(page, "Metaphysical Properties"),
    stoneDescription: text(page, "Stone Description"),
    compatibleInlayColors: multiSelect(page, "Compatible Inlay Colors"),
    shapeRestrictions: multiSelect(page, "Shape Restrictions"),
    availableForSale: checkbox(page, "Available For Sale"),
    premiumBadge: checkbox(page, "Premium Badge"),
    featuredOnHomepage: checkbox(page, "Featured on Homepage"),
    lowStockThreshold: num(page, "Low Stock Threshold"),
    originalQuantity: num(page, "Original Quantity"),
    stoneImageUrl: fileUrl(page, "Stone Image"),
    polishedPhotoUrl: fileUrl(page, "Polished Photo"),
    imageAltText: text(page, "Alt Text"),
  };
}

// Stock reserve, confirmed with Anthony 2026-07-28. A stone stops being
// offered once its remaining quantity reaches this number, rather than at
// zero — the last couple of pieces are held back as a buffer against
// breakage, a botched cut, or a piece needed as a sample, so the site can
// never sell one that isn't genuinely there to make.
//
// Hardcoded rather than a Notion field, per Anthony's standing preference for
// keeping operational/structural config in code. Change the number here.
export const STONE_RESERVE_QUANTITY = 2;

// Single chokepoint for "which stones exist" — the Studio, the Available
// Gemstones page and the Shopify catalog sync all read through here, so a
// stone dropping below the reserve disappears from all three at once rather
// than lingering in one of them.
export async function getStones(): Promise<Stone[]> {
  if (!hasNotionToken()) return mockStones;

  const rows = await queryAllRows(NOTION_DB.stones, {
    property: "Available For Sale",
    checkbox: { equals: true },
  });

  return rows.map(mapRow).filter((stone) => {
    // A blank quantity means "not tracked", not "none left" — those stones
    // stay available rather than silently vanishing on a missing field.
    if (stone.originalQuantity == null) return true;
    return stone.originalQuantity > STONE_RESERVE_QUANTITY;
  });
}
