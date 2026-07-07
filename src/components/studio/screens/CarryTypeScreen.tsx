"use client";

import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { availableCarryTypes } from "@/lib/studio/filters";
import { CmsImage } from "@/components/CmsImage";
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
    fallbackDesc: "A palm stone — larger, smooth, made to be held, you can keep it in your purse or your pocket.",
  },
  {
    id: "Hang It",
    labelKey: "formfactor_hang",
    descKey: "formfactor_hang_desc",
    fallbackLabel: "Hang it",
    fallbackDesc: "A pendant for a keychain — with you wherever you go.",
  },
];

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
      onContinue={store.goNext}
      continueDisabled={!store.carryType}
    >
      <div className="space-y-3">
        {ALL_CARRY_TYPES.filter((c) => options.includes(c.id)).map((c) => {
          const label = copyText(copy, c.labelKey, c.fallbackLabel);
          const desc = copyText(copy, c.descKey, c.fallbackDesc);
          return (
            <button
              key={c.id}
              onClick={() => store.setCarryType(c.id)}
              className={`w-full text-left rounded-2xl p-5 transition-colors ${
                store.carryType === c.id ? "bg-warm-white ring-2 ring-gold" : "bg-cream hover:bg-dusty-sky/20"
              }`}
            >
              <CmsImage src={null} alt={label} label={label} aspect="aspect-[16/9]" className="rounded-xl mb-4" />
              <p className="font-heading text-lg text-cocoa mb-1">{label}</p>
              <p className="font-body text-cocoa/60 text-sm">{desc}</p>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
