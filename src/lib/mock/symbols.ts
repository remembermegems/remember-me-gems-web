import type { Symbol } from "@/lib/notion/types";

// Dev-only fallback with rough placeholder SVG paths, used when NOTION_TOKEN
// isn't set. Real symbols (21, with production-accurate path data) live in
// the "RMG Symbol Library" Notion database.
const ALL_SHAPES = [
  "Teardrop", "Classic Oval", "Slim Oval", "Keepsake Rectangle", "Tall Rectangle",
  "Petite Rectangle", "Keepsake Square", "Dog Tag", "Petite Dog Tag", "Arrow",
  "Shield", "Oval Palm Stone", "Dog Tag Palm Stone",
];

function sym(partial: Omit<Symbol, "id" | "viewBox" | "compatibleShapes"> & { compatibleShapes?: string[] }): Symbol {
  return {
    id: `mock-${partial.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    viewBox: "0 0 100 100",
    compatibleShapes: partial.compatibleShapes ?? ALL_SHAPES,
    ...partial,
  };
}

export const mockSymbols: Symbol[] = [
  sym({
    name: "Basic Cross",
    meaning: "A simple, enduring symbol of faith.",
    grouping: ["Faith & Belief"],
    svgPathData: "M45 10 H55 V45 H90 V55 H55 V90 H45 V55 H10 V45 H45 Z",
    universal: true,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 10,
  }),
  sym({
    name: "Trinity Knot",
    meaning: "An unbroken bond, woven together for eternity.",
    grouping: ["Faith & Belief"],
    svgPathData: "M50 15 C30 15 20 35 30 50 C20 65 30 85 50 85 C70 85 80 65 70 50 C80 35 70 15 50 15 Z",
    universal: false,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 20,
  }),
  sym({
    name: "Angel Wings",
    meaning: "Watching over you, always close.",
    grouping: ["Faith & Belief"],
    svgPathData: "M50 20 C30 20 15 40 15 60 C30 55 45 45 50 30 C55 45 70 55 85 60 C85 40 70 20 50 20 Z",
    universal: false,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 30,
  }),
  sym({
    name: "Eternal Love",
    meaning: "A love that time and distance cannot end.",
    grouping: ["Love & Connection"],
    svgPathData: "M20 50 C20 30 45 30 50 45 C55 30 80 30 80 50 C80 70 50 85 50 85 C50 85 20 70 20 50 Z",
    universal: true,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 40,
  }),
  sym({
    name: "Infinity",
    meaning: "A connection with no beginning and no end.",
    grouping: ["Love & Connection"],
    svgPathData: "M30 50 C30 38 42 38 50 50 C58 62 70 62 70 50 C70 38 58 38 50 50 C42 62 30 62 30 50 Z",
    universal: true,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 50,
  }),
  sym({
    name: "Mother's Love Knot",
    meaning: "The bond between mother and child, always tied.",
    grouping: ["Love & Connection"],
    svgPathData: "M50 15 C65 15 70 30 60 40 C70 45 70 60 55 60 C60 70 50 85 50 85 C50 85 40 70 45 60 C30 60 30 45 40 40 C30 30 35 15 50 15 Z",
    universal: false,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 60,
  }),
  sym({
    name: "Sun",
    meaning: "Warmth and light that never fades.",
    grouping: ["Life & Spirit"],
    svgPathData: "M50 25 A25 25 0 1 1 49.9 25 Z",
    universal: true,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 70,
  }),
  sym({
    name: "Tree of Life",
    meaning: "Rooted, growing, connected across generations.",
    grouping: ["Life & Spirit"],
    svgPathData: "M50 85 V55 M50 55 C35 55 25 45 30 30 C35 35 42 38 50 38 C58 38 65 35 70 30 C75 45 65 55 50 55 Z",
    universal: false,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 80,
  }),
  sym({
    name: "Ocean Waves",
    meaning: "Steady, returning, endless as the tide.",
    grouping: ["Life & Spirit"],
    svgPathData: "M15 40 C25 30 35 30 45 40 C55 50 65 50 75 40 C85 30 85 30 85 30 M15 60 C25 50 35 50 45 60 C55 70 65 70 75 60 C85 50 85 50 85 50",
    universal: false,
    available: true,
    customAddOn: false,
    upcharge: 0,
    displayOrder: 90,
  }),
];
