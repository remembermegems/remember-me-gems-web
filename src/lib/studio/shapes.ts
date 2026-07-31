import type { CarryType, ShapeName } from "@/lib/notion/types";

// Shapes are intentionally NOT Notion-driven (locked 2026-07-01) — identical
// across the RMG and Pets sites, geometry baked into the render engine.
// This is the single source of truth for shape metadata used by both the
// Shapes marketing page and the Studio's shape-selection screen.
export type ShapeMeta = {
  name: ShapeName;
  family: "Pendant" | "Touchstone";
  approxSize: string;
  description: string;
  carryTypes: CarryType[];
  petiteAddOn: boolean;
};

export const SHAPES: ShapeMeta[] = [
  {
    name: "Teardrop",
    family: "Pendant",
    approxSize: "7/8″ × 1 3/8″ (22 × 34 mm)",
    description: "A gentle, tapered shape made to rest close to the heart.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Classic Oval",
    family: "Pendant",
    approxSize: "3/4″ × 1 3/4″ (19 × 44 mm)",
    description: "A balanced, timeless shape with a smooth curve that suits everyday wear.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Slim Oval",
    family: "Pendant",
    approxSize: "5/8″ × 1 1/2″ (17 × 37 mm)",
    description: "A more slender oval with an elongated profile, light and understated.",
    carryTypes: ["Wear It"],
    petiteAddOn: true,
  },
  {
    name: "Keepsake Rectangle",
    family: "Pendant",
    approxSize: "1 1/4″ × 1 3/4″ (30 × 44 mm)",
    description: "A soft-cornered rectangle with a clean, grounded presence. Its wider face is ideal for larger or wider symbols.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Tall Rectangle",
    family: "Pendant",
    approxSize: "3/4″ × 1 3/4″ (18 × 43 mm)",
    description: "A longer rectangle with simple lines and a distinctive vertical profile.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Petite Rectangle",
    family: "Pendant",
    approxSize: "3/4″ × 1 1/4″ (18 × 30 mm)",
    description: "A smaller rectangle designed for a subtle, delicate keepsake.",
    carryTypes: ["Wear It"],
    petiteAddOn: true,
  },
  {
    name: "Keepsake Square",
    family: "Pendant",
    approxSize: "1″ × 1 1/8″ (25 × 28 mm)",
    description: "A compact square with softened corners and a quiet, balanced feel. Great for larger or wider symbols.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Dog Tag",
    family: "Pendant",
    approxSize: "1 3/8″ × 2″ (34 × 51 mm)",
    description: "A familiar, substantial shape with room for a meaningful symbol and initials.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Petite Dog Tag",
    family: "Pendant",
    approxSize: "1″ × 1 3/8″ (24 × 36 mm)",
    description: "A smaller version of the familiar dog tag shape, simple and easy to wear.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Arrow",
    family: "Pendant",
    approxSize: "2″ × 1 1/4″ (50 × 31 mm)",
    description: "A bold, directional shape with a substantial profile and defined lines. Made for those who prefer a larger, more distinctive shape.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Shield",
    family: "Pendant",
    approxSize: "2″ × 1 1/4″ (50 × 31 mm)",
    description: "A bold shield silhouette with a substantial profile and defined edges. Made for those who prefer a larger, more commanding shape.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Oval Touchstone",
    family: "Touchstone",
    approxSize: "1 1/4″ × 2 1/8″ (32 × 55 mm)",
    description: "A smooth oval, shaped to rest naturally in the hand or slip into a pocket.",
    carryTypes: ["Carry It"],
    petiteAddOn: false,
  },
  {
    name: "Dog Tag Touchstone",
    family: "Touchstone",
    approxSize: "1 3/8″ × 2″ (34 × 51 mm)",
    description: "The familiar dog tag silhouette, shaped for holding rather than wearing.",
    carryTypes: ["Carry It"],
    petiteAddOn: false,
  },
];

export const SHAPE_ADDON_PRICE = 50;
