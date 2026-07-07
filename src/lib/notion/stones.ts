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
    // Known gap (2026-07-02): Morado Opal's Large Palm Stone Upcharge is unset in Notion.
    // Defaulting to 0 rather than guessing — confirm the real number with Anthony before launch.
    largePalmStoneUpcharge: num(page, "Large Palm Stone Upcharge") ?? 0,
    grouping: multiSelect(page, "Grouping"),
    colorFamily: select(page, "Color Family"),
    metaphysicalThemes: multiSelect(page, "Metaphysical Themes"),
    metaphysicalProperties: text(page, "Metaphysical Properties"),
    stoneDescription: text(page, "Stone Description"),
    compatibleInlayColors: multiSelect(page, "Compatible Inlay Colors"),
    shapeRestrictions: multiSelect(page, "Shape Restrictions"),
    availableForSale: checkbox(page, "Available For Sale"),
    premiumBadge: checkbox(page, "Premium Badge"),
    lowStockThreshold: num(page, "Low Stock Threshold"),
    originalQuantity: num(page, "Original Quantity"),
    stoneImageUrl: fileUrl(page, "Stone Image"),
    polishedPhotoUrl: fileUrl(page, "Polished Photo"),
  };
}

export async function getStones(): Promise<Stone[]> {
  if (!hasNotionToken()) return mockStones;

  const rows = await queryAllRows(NOTION_DB.stones, {
    property: "Available For Sale",
    checkbox: { equals: true },
  });

  return rows.map(mapRow);
}
