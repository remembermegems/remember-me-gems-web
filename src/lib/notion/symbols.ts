import { NOTION_DB } from "./config";
import { hasNotionToken, queryAllRows, text, num, multiSelect, checkbox, type NotionPage } from "./client";
import type { Symbol } from "./types";
import { mockSymbols } from "@/lib/mock/symbols";

function mapRow(page: NotionPage): Symbol {
  return {
    id: page.id,
    name: text(page, "Symbol Name"),
    meaning: text(page, "Meaning"),
    grouping: multiSelect(page, "Grouping"),
    compatibleShapes: multiSelect(page, "Compatible Shapes"),
    svgPathData: text(page, "SVG Path Data"),
    viewBox: text(page, "ViewBox"),
    universal: checkbox(page, "Universal"),
    available: checkbox(page, "Available"),
    customAddOn: checkbox(page, "Custom Add-on"),
    upcharge: num(page, "Upcharge") ?? 0,
    displayOrder: num(page, "Display Order") ?? 0,
  };
}

export async function getSymbols(): Promise<Symbol[]> {
  if (!hasNotionToken()) return mockSymbols;

  const rows = await queryAllRows(NOTION_DB.symbols, {
    property: "Available",
    checkbox: { equals: true },
  });

  return rows.map(mapRow).sort((a, b) => a.displayOrder - b.displayOrder);
}
