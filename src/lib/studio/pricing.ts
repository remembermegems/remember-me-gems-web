import type { CarryType, Stone } from "@/lib/notion/types";
import { SHAPES, SHAPE_ADDON_PRICE } from "./shapes";
import type { ShapeName } from "@/lib/notion/types";

// Flat add-ons — not yet Notion-driven (known simplification for the alpha,
// flagged in the pricing memory as a follow-up once beyond the alpha).
export const CUSTOM_SYMBOL_ADDON = 100;

export type AddOnKind = "touchstone" | "petite" | "custom-symbol";

export type ResolvedAddOn = { kind: AddOnKind; label: string; amount: number };

type PriceInputs = {
  stone: Stone | null;
  shape: ShapeName | null;
  carryType: CarryType | null;
  customSymbolAddOn?: boolean;
};

// Structured add-ons, so the Shopify checkout can map each one to its own
// product without re-deriving (or worse, string-parsing) the rules. Both the
// customer-facing labels and the Shopify line items come from this one list,
// which is what keeps the price shown on Review and the price actually charged
// from drifting apart.
export function resolveAddOns({ stone, shape, carryType, customSymbolAddOn }: PriceInputs): ResolvedAddOn[] {
  if (!stone) return [];
  const addOns: ResolvedAddOn[] = [];

  if (carryType === "Carry It" && stone.touchstoneUpcharge > 0) {
    addOns.push({
      kind: "touchstone",
      label: `Touchstone upcharge (+$${stone.touchstoneUpcharge})`,
      amount: stone.touchstoneUpcharge,
    });
  }

  const shapeMeta = shape ? SHAPES.find((s) => s.name === shape) : null;
  if (shapeMeta?.petiteAddOn) {
    addOns.push({ kind: "petite", label: `Petite shape (+$${SHAPE_ADDON_PRICE})`, amount: SHAPE_ADDON_PRICE });
  }

  if (customSymbolAddOn) {
    addOns.push({
      kind: "custom-symbol",
      label: `Custom symbol (+$${CUSTOM_SYMBOL_ADDON})`,
      amount: CUSTOM_SYMBOL_ADDON,
    });
  }

  return addOns;
}

export function calculatePrice({
  stone,
  shape,
  carryType,
  betaMode,
  customSymbolAddOn,
}: PriceInputs & { betaMode: boolean }): { basePrice: number; addOns: string[]; total: number } {
  if (!stone) return { basePrice: 0, addOns: [], total: 0 };

  const basePrice = betaMode ? stone.betaPrice : stone.launchPrice;
  const resolved = resolveAddOns({ stone, shape, carryType, customSymbolAddOn });

  return {
    basePrice,
    addOns: resolved.map((a) => a.label),
    total: basePrice + resolved.reduce((sum, a) => sum + a.amount, 0),
  };
}
