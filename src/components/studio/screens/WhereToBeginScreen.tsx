"use client";

import { useStudioStore, type BeginChoice } from "@/store/studio";
import { CmsImage } from "@/components/CmsImage";
import { copyText } from "@/lib/notion/configuratorCopy";

const TILE_KEYS: { choice: BeginChoice; labelKey: string; descKey: string; fallbackLabel: string; fallbackDesc: string }[] = [
  { choice: "stone", labelKey: "wheretobegin_stone_label", descKey: "wheretobegin_stone_desc", fallbackLabel: "Stone", fallbackDesc: "Start with the stone that speaks to you" },
  { choice: "shape", labelKey: "wheretobegin_shape_label", descKey: "wheretobegin_shape_desc", fallbackLabel: "Shape", fallbackDesc: "Choose the shape that feels right" },
  { choice: "carry-type", labelKey: "wheretobegin_carry_label", descKey: "wheretobegin_carry_desc", fallbackLabel: "How You'll Carry It", fallbackDesc: "Decide how you'll keep them close" },
  { choice: "symbol", labelKey: "wheretobegin_symbol_label", descKey: "wheretobegin_symbol_desc", fallbackLabel: "Symbol", fallbackDesc: "Start with a symbol that means something" },
];

export function WhereToBeginScreen({ copy }: { copy: Record<string, string> }) {
  const chooseBeginWith = useStudioStore((s) => s.chooseBeginWith);
  const goBack = useStudioStore((s) => s.goBack);

  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {copyText(copy, "wheretobegin_headline", "Where would you like to begin?")}
        </h2>
        <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-gold to-blue" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TILE_KEYS.map((t) => {
          const label = copyText(copy, t.labelKey, t.fallbackLabel);
          const desc = copyText(copy, t.descKey, t.fallbackDesc);
          return (
            <button
              key={t.choice}
              onClick={() => chooseBeginWith(t.choice)}
              className="text-left rounded-2xl bg-cream hover:bg-dusty-sky/20 p-6 transition-colors"
            >
              <CmsImage src={null} alt={label} label={label} aspect="aspect-[16/9]" className="rounded-xl mb-4" />
              <p className="font-heading text-xl text-cocoa mb-1">{label}</p>
              <p className="font-body text-cocoa/60 text-sm">{desc}</p>
            </button>
          );
        })}
      </div>
      <div className="flex justify-center mt-10">
        <button onClick={goBack} className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa">
          {copyText(copy, "global_back_btn", "Back")}
        </button>
      </div>
    </div>
  );
}
