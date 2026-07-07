"use client";

import { useStudioStore, type StepId } from "@/store/studio";
import { GemCanvas } from "../GemCanvas";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { calculatePrice } from "@/lib/studio/pricing";
import { copyText } from "@/lib/notion/configuratorCopy";

export function ReviewScreen({ betaMode, copy }: { betaMode: boolean; copy: Record<string, string> }) {
  const store = useStudioStore();

  if (!store.stone || !store.shape) return null;

  const tileColor = stoneSwatchColor(store.stone.name, store.stone.colorFamily);
  const { basePrice, addOns, total } = calculatePrice({
    stone: store.stone,
    shape: store.shape,
    carryType: store.carryType,
    betaMode,
    customSymbolAddOn: store.symbol?.customAddOn,
  });
  const launchTotal = calculatePrice({
    stone: store.stone,
    shape: store.shape,
    carryType: store.carryType,
    betaMode: false,
    customSymbolAddOn: store.symbol?.customAddOn,
  }).total;

  // Template substitution for the Notion-authored dedication line, which
  // doubles as a gentle spelling-check nudge — designed but never actually
  // rendered anywhere in the built Review screen until now.
  const yearRange = store.birthYear || store.deathYear ? `, ${store.birthYear || "?"}–${store.deathYear || "?"}` : "";
  const dedicationNote = copyText(
    copy,
    "review_dedication_note",
    "In memory of {firstName} {lastName}{yearRange} — please check the spelling."
  )
    .replace("{firstName}", store.firstName)
    .replace("{lastName}", store.lastName)
    .replace("{yearRange}", yearRange);

  const choices: { label: string; value: string; step: StepId }[] = [
    { label: "Gemstone", value: store.stone.name, step: "stone" },
    { label: "Shape", value: store.shape, step: "shape" },
    { label: "How you'll carry it", value: store.carryType ?? "—", step: "carry-type" },
    { label: "Symbol", value: store.symbol?.name ?? "—", step: "symbol" },
    { label: "Inlay color", value: store.inlayColor ?? "Natural", step: "inlay" },
    { label: "Lettering style", value: store.letteringStyle ?? "Monument", step: "inlay" },
    { label: "Initials", value: store.initials || "—", step: "inlay" },
  ];

  function handleAddToCart() {
    store.addCurrentGemToCart({ basePrice, addOns, totalPrice: total });
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {copyText(copy, "review_headline", "Review Your Gem")}
        </h2>
        <p className="font-body text-cocoa/60">
          {copyText(copy, "review_subtitle", "Take a moment to look everything over before continuing.")}
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-gold to-blue" />
      </div>

      <div className="flex justify-center gap-8 mb-10 flex-wrap">
        <div className="text-center">
          <GemCanvas
            shape={store.shape}
            stoneColor={tileColor}
            stoneImageUrl={store.stone.stoneImageUrl}
            inlayColor={store.inlayColor ?? "Natural"}
            symbol={store.symbol ? { name: store.symbol.name, path: store.symbol.svgPathData, viewBox: store.symbol.viewBox } : null}
            side="front"
            maxWidth={180}
          />
        </div>
        <div className="text-center">
          <GemCanvas
            shape={store.shape}
            stoneColor={tileColor}
            stoneImageUrl={store.stone.stoneImageUrl}
            inlayColor={store.inlayColor ?? "Natural"}
            side="back"
            initials={store.initials}
            letteringStyle={store.letteringStyle ?? "Monument"}
            maxWidth={180}
          />
        </div>
      </div>

      <p className="text-center font-body text-cocoa/80 mb-8">{dedicationNote}</p>

      <div className="rounded-2xl bg-cream divide-y divide-cocoa/10 mb-8">
        {choices.map((c) => (
          <div key={c.label} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-cocoa/50">{c.label}</p>
              <p className="font-body text-cocoa">{c.value}</p>
            </div>
            <button onClick={() => store.editFromReview(c.step)} className="text-sm text-blue underline">
              Change
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        {betaMode && <p className="text-cocoa/40 line-through text-sm">${launchTotal}</p>}
        <p className="font-heading text-3xl text-cocoa">${total}</p>
        {betaMode && <p className="text-gold text-sm">Beta pricing — $100 off while we refine the process</p>}
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={store.goBack} className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa">
          {copyText(copy, "global_back_btn", "Back")}
        </button>
        <button
          onClick={handleAddToCart}
          className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa"
        >
          {copyText(copy, "review_btn", "Add to Cart")}
        </button>
      </div>
    </div>
  );
}
