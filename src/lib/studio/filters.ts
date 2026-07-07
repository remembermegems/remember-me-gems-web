import type { CarryType, ShapeName, Stone, Symbol } from "@/lib/notion/types";
import { SHAPE_NAMES } from "@/lib/notion/types";
import { SHAPES } from "./shapes";

// Fallback section for stones whose Grouping field hasn't been tagged yet in
// Notion (true for all 28 stones as of 2026-07-03) — never silently hide
// inventory from the catalog/Studio just because a field is empty.
export const UNGROUPED_LABEL = "All Gemstones";
export function effectiveGrouping(stone: Stone): string[] {
  return stone.grouping.length ? stone.grouping : [UNGROUPED_LABEL];
}

// Pure cross-filtering functions. Shape is the pivot every other choice
// constrains through (stone -> Shape Restrictions, symbol -> Compatible
// Shapes, carry type -> the shape's own carryTypes) — see the Studio's
// "never show them a choice they don't have" rule.

export function shapesForStone(stone: Stone | null): ShapeName[] {
  if (!stone || stone.shapeRestrictions.length === 0) return [...SHAPE_NAMES];
  return stone.shapeRestrictions as ShapeName[];
}

export function shapesForSymbol(symbol: Symbol | null): ShapeName[] {
  if (!symbol || symbol.compatibleShapes.length === 0) return [...SHAPE_NAMES];
  return symbol.compatibleShapes as ShapeName[];
}

export function shapesForCarryType(carryType: CarryType | null): ShapeName[] {
  if (!carryType) return [...SHAPE_NAMES];
  return SHAPES.filter((s) => s.carryTypes.includes(carryType)).map((s) => s.name);
}

// Intersects every active constraint into the set of shapes still choosable.
export function availableShapes(selections: { stone?: Stone | null; symbol?: Symbol | null; carryType?: CarryType | null }): ShapeName[] {
  const sets = [
    shapesForStone(selections.stone ?? null),
    shapesForSymbol(selections.symbol ?? null),
    shapesForCarryType(selections.carryType ?? null),
  ];
  return SHAPE_NAMES.filter((shape) => sets.every((set) => set.includes(shape)));
}

export function availableStones(stones: Stone[], shape: ShapeName | null): Stone[] {
  if (!shape) return stones;
  return stones.filter((s) => s.shapeRestrictions.length === 0 || s.shapeRestrictions.includes(shape));
}

export function availableSymbols(symbols: Symbol[], shape: ShapeName | null): Symbol[] {
  if (!shape) return symbols;
  return symbols.filter((s) => s.compatibleShapes.includes(shape));
}

export function availableCarryTypes(
  carryTypes: CarryType[],
  selections: { stone?: Stone | null; symbol?: Symbol | null; shape?: ShapeName | null }
): CarryType[] {
  const shape = selections.shape ?? null;
  if (shape) {
    const meta = SHAPES.find((s) => s.name === shape);
    return meta ? carryTypes.filter((c) => meta.carryTypes.includes(c)) : carryTypes;
  }
  // Shape isn't chosen yet — union carry types across every shape still
  // compatible with whatever stone/symbol is already known (e.g. a deep-linked
  // stone), so this screen narrows correctly even before Shape is picked.
  const candidateShapes = availableShapes({ stone: selections.stone, symbol: selections.symbol, carryType: null });
  const viable = new Set<CarryType>();
  candidateShapes.forEach((shapeName) => {
    SHAPES.find((s) => s.name === shapeName)?.carryTypes.forEach((c) => viable.add(c));
  });
  return carryTypes.filter((c) => viable.has(c));
}

export function availableInlayColors(stone: Stone | null): string[] {
  if (!stone) return ["Natural", "Gold", "Silver", "White", "Turquoise"];
  return stone.compatibleInlayColors;
}
