"use client";

import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { GemCanvas } from "../GemCanvas";
import { SHAPES, SHAPE_ADDON_PRICE } from "@/lib/studio/shapes";
import { availableShapes } from "@/lib/studio/filters";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";

export function ShapeScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  const allowedShapes = availableShapes({ stone: store.stone, symbol: store.symbol, carryType: store.carryType });
  const shapes = SHAPES.filter((s) => allowedShapes.includes(s.name));

  const tileColor = store.stone ? stoneSwatchColor(store.stone.name, store.stone.colorFamily) : "#7FA7D8";

  // shape_size_format_note is a template ("Approximately {width} × {height}
  // ({widthMM} × {heightMM} mm)") written for width/height stored as separate
  // fields — shapes.ts instead stores each shape's dimension as one complete
  // pre-formatted string. Rather than restructure that data model, we just
  // pull the prefix word (everything before the first "{" token) from Notion
  // and prepend it, so the wording stays Notion-editable without a rebuild.
  const sizePrefix = copyText(copy, "shape_size_format_note", "Approximately {width}").split("{")[0].trim();

  return (
    <StepShell
      headline={copyText(copy, "shape_headline", "Choose their shape")}
      subhead={copyText(
        copy,
        "shape_subtitle",
        "Only shapes available for how you'd like to carry your Remember Me Gem are shown. Shapes appear in your chosen gemstone once you've selected one — otherwise they preview in a placeholder color."
      )}
      copy={copy}
      onBack={store.goBack}
      onContinue={store.goNext}
      continueDisabled={!store.shape}
      stickyContinue
    >
      <div className="space-y-3">
        {shapes.map((shape) => {
          const isSelected = store.shape === shape.name;
          return (
            <button
              key={shape.name}
              onClick={() => store.setShape(shape.name)}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-colors ${
                isSelected ? "bg-warm-white ring-[3px] ring-gold shadow-md" : "bg-cream hover:bg-dusty-sky/20"
              }`}
            >
              <div className="shrink-0 flex items-center justify-center" style={{ width: 72 }}>
                <GemCanvas shape={shape.name} stoneColor={tileColor} stoneImageUrl={store.stone?.stoneImageUrl} inlayColor="Gold" maxWidth={60} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-lg text-cocoa">{shape.name}</p>
                  {shape.petiteAddOn && (
                    <span className="text-[11px] font-medium bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                      {copyText(copy, "shape_addon_badge", `+$${SHAPE_ADDON_PRICE}`)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-cocoa/50 mb-1">
                  {sizePrefix} {shape.approxSize}
                </p>
                <p className="font-body text-cocoa/70 text-sm">{shape.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* New — Notion already had shape_special_request_link ready, but this
          screen never actually had one (Symbol's already existed). */}
      <p className="text-center text-sm mt-6">
        <a href="/special-requests" className="text-blue underline">
          {copyText(copy, "shape_special_request_link", "Not seeing a shape that fits? Make a special request")}
        </a>
      </p>
    </StepShell>
  );
}
