"use client";

import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { availableCarryTypes } from "@/lib/studio/filters";
import { CmsImage } from "@/components/CmsImage";
import { SymbolTile } from "@/components/SymbolTile";
import { GemCanvas } from "../GemCanvas";
import { SelectionContinue, SelectedBadge } from "../SelectionContinue";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";
import type { CarryType } from "@/lib/notion/types";

// Restored 2026-07-06 to the original v9e prototype's copy (Anthony's
// explicit preference) — which turned out to already be sitting, almost
// verbatim, in Notion's formfactor_* rows. The live screen had drifted to
// different, newer wording during a later build pass; this replaces it.
const ALL_CARRY_TYPES: { id: CarryType; labelKey: string; descKey: string; fallbackLabel: string; fallbackDesc: string }[] = [
  {
    id: "Wear It",
    labelKey: "formfactor_wear",
    descKey: "formfactor_wear_desc",
    fallbackLabel: "Wear it",
    fallbackDesc: "A pendant on a chain — something to keep close to your heart every day.",
  },
  {
    id: "Carry It",
    labelKey: "formfactor_carry",
    descKey: "formfactor_carry_desc",
    fallbackLabel: "Carry it",
    fallbackDesc: "A touchstone — larger, smooth, made to be held, you can keep it in your purse or your pocket.",
  },
  {
    id: "Hang It",
    labelKey: "formfactor_hang",
    descKey: "formfactor_hang_desc",
    fallbackLabel: "Hang it",
    fallbackDesc: "A pendant for a keychain — with you wherever you go.",
  },
];

// Acknowledges the choice a deep-linked visitor already made on a gallery page
// ("Begin with this gemstone/shape/symbol") — without it they land here cold,
// with nothing confirming their click registered. Restored 2026-07-28 after
// being lost with InMemoryOfScreen in the round 1 flow restructure.
//
// Deep-link entry is derived from stepOrder rather than `beginChoice`:
// `beginChoice` is set by BOTH chooseBeginWith and beginFromDeepLink, so it
// can't tell the two apart on its own, and a normal-flow visitor arriving here
// having already picked a stone would wrongly get the pill. Only
// computeStepOrder (the normal path) includes "where-to-begin".
function ChosenStrip() {
  const { stone, shape, symbol, stepOrder } = useStudioStore();
  if (stepOrder.includes("where-to-begin")) return null;

  const label = stone?.name ?? symbol?.name ?? shape;
  if (!label) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dusty-sky bg-dusty-sky/10 px-4 py-2.5 mb-8 max-w-sm mx-auto">
      <div className="shrink-0 flex items-center justify-center" style={{ width: 30, height: 30 }}>
        {stone && (
          <div
            className="w-full h-full rounded-full"
            style={{ background: stoneSwatchColor(stone.name, stone.colorFamily) }}
          />
        )}
        {symbol && <SymbolTile name={symbol.name} path={symbol.svgPathData} viewBox={symbol.viewBox} size={30} />}
        {shape && !stone && !symbol && (
          <GemCanvas shape={shape} stoneColor="#AFC4D6" inlayColor="Gold" maxWidth={30} />
        )}
      </div>
      <div>
        <p className="text-xs text-cocoa/50 font-body leading-tight">You&rsquo;ve chosen</p>
        <p className="text-sm font-body font-medium text-cocoa leading-tight">{label}</p>
      </div>
    </div>
  );
}

export function CarryTypeScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  const options = availableCarryTypes(
    ALL_CARRY_TYPES.map((c) => c.id),
    { stone: store.stone, symbol: store.symbol, shape: store.shape }
  );

  return (
    <StepShell
      headline={copyText(copy, "formfactor_headline", "How to carry it")}
      subhead={copyText(
        copy,
        "formfactor_subtitle",
        "This shapes everything that follows — the gemstone options, the sizes, and the feel of what you're creating."
      )}
      copy={copy}
      onBack={store.goBack}
    >
      <ChosenStrip />
      <div className="space-y-3">
        {ALL_CARRY_TYPES.filter((c) => options.includes(c.id)).map((c) => {
          const label = copyText(copy, c.labelKey, c.fallbackLabel);
          const desc = copyText(copy, c.descKey, c.fallbackDesc);
          const isSelected = store.carryType === c.id;
          return (
            <div
              key={c.id}
              className={`rounded-2xl transition-colors ${isSelected ? "bg-warm-white ring-2 ring-gold" : "bg-cream hover:bg-dusty-sky/20"}`}
            >
              <button
                onClick={() => store.setCarryType(c.id)}
                aria-pressed={isSelected}
                className="w-full text-left p-5"
              >
                <CmsImage src={null} alt={label} label={label} aspect="aspect-[16/9]" className="rounded-xl mb-4" />
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-heading text-lg text-cocoa">{label}</p>
                  {isSelected && <SelectedBadge />}
                </div>
                <p className="font-body text-cocoa/60 text-sm">{desc}</p>
              </button>
              {isSelected && <SelectionContinue onContinue={store.goNext} copy={copy} className="px-5 pb-5" />}
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}
