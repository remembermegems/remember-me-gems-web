"use client";

import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { GemCanvas } from "../GemCanvas";
import { availableInlayColors } from "@/lib/studio/filters";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";
import type { InlayColor, LetteringStyle } from "@/lib/notion/types";

const LETTERING_STYLES: LetteringStyle[] = ["Flowing Script", "Monument"];
const LETTERING_STYLE_KEY: Record<LetteringStyle, string> = {
  "Flowing Script": "lettering_option_script",
  Monument: "lettering_option_block",
};

export function InlayScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  if (!store.shape || !store.stone) return null;

  const colors = availableInlayColors(store.stone) as InlayColor[];
  const tileColor = stoneSwatchColor(store.stone.name, store.stone.colorFamily);
  const inlay = store.inlayColor ?? "Natural";
  const lettering = store.letteringStyle ?? "Monument";

  const headlineTemplate = copyText(copy, "inlay_headline", "{firstName}'s Remember Me Gem");

  return (
    <StepShell
      headline={headlineTemplate.replace("{firstName}", store.firstName || "Their")}
      copy={copy}
      onBack={store.goBack}
      onContinue={() => {
        if (!store.inlayColor) store.setInlayColor("Natural");
        if (!store.letteringStyle) store.setLetteringStyle("Monument");
        store.goNext();
      }}
      continueLabel="Review Your Gem"
    >
      <div className="flex justify-center gap-8 mb-10 flex-wrap">
        <div className="text-center">
          <GemCanvas shape={store.shape} stoneColor={tileColor} stoneImageUrl={store.stone.stoneImageUrl} inlayColor={inlay} symbol={store.symbol ? { name: store.symbol.name, path: store.symbol.svgPathData, viewBox: store.symbol.viewBox } : null} side="front" maxWidth={180} />
          <p className="text-xs text-cocoa/50 mt-2">Front</p>
        </div>
        <div className="text-center">
          <GemCanvas shape={store.shape} stoneColor={tileColor} stoneImageUrl={store.stone.stoneImageUrl} inlayColor={inlay} side="back" initials={store.initials} letteringStyle={lettering} maxWidth={180} />
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

      <p className="text-center text-cocoa/60 text-sm mb-8">
        {copyText(copy, "initials_helper", "We'll engrave their initials on the back.")}
      </p>

      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-3">Inlay color</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => store.setInlayColor(c)}
              className={`px-4 py-2 rounded-full text-sm border ${
                inlay === c ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-3">Lettering style</p>
        <div className="flex justify-center gap-3">
          {LETTERING_STYLES.map((l) => (
            <button
              key={l}
              onClick={() => store.setLetteringStyle(l)}
              className={`px-4 py-2 rounded-full text-sm border ${
                lettering === l ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"
              }`}
            >
              {copyText(copy, LETTERING_STYLE_KEY[l], l)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-3">Initials (optional)</p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              maxLength={1}
              value={store.initials[i] ?? ""}
              onChange={(e) => {
                const chars = store.initials.split("");
                chars[i] = e.target.value.slice(-1);
                store.setInitials(chars.join(""));
              }}
              className="w-14 h-14 text-center text-xl rounded-xl border border-cocoa/15 bg-warm-white font-heading uppercase"
            />
          ))}
        </div>
      </div>

      <p className="text-center text-sm">
        <a href="/special-requests" className="text-blue underline">
          {copyText(copy, "inlay_special_request_link", "Need more than 3 characters? Make a special request")}
        </a>
      </p>
    </StepShell>
  );
}
