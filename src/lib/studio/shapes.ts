import type { CarryType, ShapeName } from "@/lib/notion/types";

// Shapes are intentionally NOT Notion-driven (locked 2026-07-01) — identical
// across the RMG and Pets sites, geometry baked into the render engine.
// This is the single source of truth for shape metadata used by both the
// Shapes marketing page and the Studio's shape-selection screen.
export type ShapeMeta = {
  name: ShapeName;
  family: "Pendant" | "Palm Stone";
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
    description: "A soft, falling curve — the shape of a moment held gently.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Classic Oval",
    family: "Pendant",
    approxSize: "3/4″ × 1 3/4″ (19 × 44 mm)",
    description: "A timeless, rounded silhouette that suits nearly any stone.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Slim Oval",
    family: "Pendant",
    approxSize: "5/8″ × 1 1/2″ (17 × 37 mm)",
    description: "A narrower, more delicate take on the classic oval.",
    carryTypes: ["Wear It"],
    petiteAddOn: true,
  },
  {
    name: "Keepsake Rectangle",
    family: "Pendant",
    approxSize: "1 1/4″ × 1 3/4″ (30 × 44 mm)",
    description: "Clean, structured lines with room for a fuller symbol.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Tall Rectangle",
    family: "Pendant",
    approxSize: "3/4″ × 1 3/4″ (18 × 43 mm)",
    description: "A slender, elongated rectangle with quiet presence.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Petite Rectangle",
    family: "Pendant",
    approxSize: "3/4″ × 1 1/4″ (18 × 30 mm)",
    description: "A smaller, more understated rectangle.",
    carryTypes: ["Wear It"],
    petiteAddOn: true,
  },
  {
    name: "Keepsake Square",
    family: "Pendant",
    approxSize: "1″ × 1 1/8″ (25 × 28 mm)",
    description: "Balanced and grounded, a square held close.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Dog Tag",
    family: "Pendant",
    approxSize: "1 3/8″ × 2″ (34 × 51 mm)",
    description: "Service and strength, worn the way it's always been worn.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Petite Dog Tag",
    family: "Pendant",
    approxSize: "1″ × 1 3/8″ (24 × 36 mm)",
    description: "The same familiar shape, sized smaller and lighter.",
    carryTypes: ["Wear It", "Hang It"],
    petiteAddOn: false,
  },
  {
    name: "Arrow",
    family: "Pendant",
    approxSize: "2″ × 1 1/4″ (50 × 31 mm)",
    description: "Forward-moving and direct, pointing the way home.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Shield",
    family: "Pendant",
    approxSize: "2″ × 1 1/4″ (50 × 31 mm)",
    description: "Steady and protective — the shape of someone who stood guard.",
    carryTypes: ["Wear It"],
    petiteAddOn: false,
  },
  {
    name: "Oval Palm Stone",
    family: "Palm Stone",
    approxSize: "1 1/4″ × 2 1/8″ (32 × 55 mm)",
    description: "Smooth and rounded, made to be held rather than worn.",
    carryTypes: ["Carry It"],
    petiteAddOn: false,
  },
  {
    name: "Dog Tag Palm Stone",
    family: "Palm Stone",
    approxSize: "1 3/8″ × 2″ (34 × 51 mm)",
    description: "The dog tag's familiar outline, shaped to rest in your hand.",
    carryTypes: ["Carry It"],
    petiteAddOn: false,
  },
];

export const SHAPE_ADDON_PRICE = 50;
