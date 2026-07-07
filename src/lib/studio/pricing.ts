import type { CarryType, Stone } from "@/lib/notion/types";
import { SHAPES, SHAPE_ADDON_PRICE } from "./shapes";
import type { ShapeName } from "@/lib/notion/types";

// Flat add-ons — not yet Notion-driven (known simplification for the alpha,
// flagged in the pricing memory as a follow-up once beyond the alpha).
export const CUSTOM_SYMBOL_ADDON = 100;

export function calculatePrice({
  stone,
  shape,
  carryType,
  betaMode,
  customSymbolAddOn,
}: {
  stone: Stone | null;
  shape: ShapeName | null;
  carryType: CarryType | null;
  betaMode: boolean;
  customSymbolAddOn?: boolean;
}): { basePrice: number; addOns: string[]; total: number } {
  if (!stone) return { basePrice: 0, addOns: [], total: 0 };

  const basePrice = betaMode ? stone.betaPrice : stone.launchPrice;
  const addOns: string[] = [];
  let total = basePrice;

  const isPalm = carryType === "Carry It";
  if (isPalm && stone.largePalmStoneUpcharge > 0) {
    total += stone.largePalmStoneUpcharge;
    addOns.push(`Palm stone upcharge (+$${stone.largePalmStoneUpcharge})`);
  }

  const shapeMeta = shape ? SHAPES.find((s) => s.name === shape) : null;
  if (shapeMeta?.petiteAddOn) {
    total += SHAPE_ADDON_PRICE;
    addOns.push(`Petite shape (+$${SHAPE_ADDON_PRICE})`);
  }

  if (customSymbolAddOn) {
    total += CUSTOM_SYMBOL_ADDON;
    addOns.push(`Custom symbol (+$${CUSTOM_SYMBOL_ADDON})`);
  }

  return { basePrice, addOns, total };
}
