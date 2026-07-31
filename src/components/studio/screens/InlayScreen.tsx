"use client";

import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { GemCanvas } from "../GemCanvas";
import { availableInlayColors } from "@/lib/studio/filters";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";
import type { InlayColor } from "@/lib/notion/types";

export function InlayScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  if (!store.shape || !store.stone) return null;

  const colors = availableInlayColors(store.stone) as InlayColor[];
  const tileColor = stoneSwatchColor(store.stone.name, store.stone.colorFamily);
  const inlay = store.inlayColor ?? "Natural";
  const lettering = store.letteringStyle ?? "Monument";

  // The honoree's name is collected on the *next* screen now, so for a first
  // gem there is no name to interpolate here — fall back to a name-free
  // headline rather than rendering a broken possessive.
  const headline = store.firstName
    ? copyText(copy, "inlay_headline", "{firstName}'s Remember Me Gem").replace("{firstName}", store.firstName)
    : copyText(copy, "inlay_headline_noname", "Your Remember Me Gem");

  return (
    <StepShell
      headline={headline}
      copy={copy}
      onBack={store.goBack}
      onContinue={() => {
        if (!store.inlayColor) store.setInlayColor("Natural");
        store.goNext();
      }}
    >
      <div className="flex justify-center gap-8 mb-10 flex-wrap">
        <div className="text-center">
          <GemCanvas shape={store.shape} stoneColor={tileColor} stoneImageUrl={store.stone.stoneImageUrl} inlayColor={inlay} symbol={store.symbol ? { name: store.symbol.name, path: store.symbol.svgPathData, viewBox: store.symbol.viewBox } : null} side="front" maxWidth={180} stoneName={store.stone.name} />
          <p className="text-xs text-cocoa/50 mt-2">Front</p>
        </div>
        <div className="text-center">
          <GemCanvas shape={store.shape} stoneColor={tileColor} stoneImageUrl={store.stone.stoneImageUrl} inlayColor={inlay} side="back" initials={store.initials} letteringStyle={lettering} maxWidth={180} stoneName={store.stone.name} />
          <p className="text-xs text-cocoa/50 mt-2">Back</p>
        </div>
      </div>

      <p className="text-center text-cocoa/40 text-xs italic mb-6">
        {copyText(
          copy,
          "inlay_preview_disclaimer",
          "This is a rough approximation of what your Remember Me Gem will look like — stone patterns and size may vary."
        )}
      </p>

      <div>
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-3">Inlay color</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => store.setInlayColor(c)}
              aria-pressed={inlay === c}
              className={`px-4 py-2 rounded-full text-sm border ${
                inlay === c ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
