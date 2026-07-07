"use client";

import { useState } from "react";
import { GemCanvas } from "@/components/studio/GemCanvas";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import type { Stone, ShapeName } from "@/lib/notion/types";

// Three deliberately contrasting shapes: a very elongated oval (Classic
// Oval), an elongated rectangle with sharp corners (Tall Rectangle), and a
// near-square shape (Keepsake Square) — so the difference between "even
// ring" and "follows the real outline" is obvious across all three at once.
const SHAPES: ShapeName[] = ["Classic Oval", "Tall Rectangle", "Keepsake Square"];

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block mb-4">
      <div className="flex justify-between text-sm font-body text-cocoa mb-1">
        <span>{label}</span>
        <span className="text-cocoa/50">{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function VignetteTuner({ stone }: { stone: Stone }) {
  const [widthFrac, setWidthFrac] = useState(0.28);
  const [blurFrac, setBlurFrac] = useState(0.09);
  const [darkness, setDarkness] = useState(0.62);

  const stoneColor = stoneSwatchColor(stone.name, stone.colorFamily);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 font-body">
      <h1 className="font-heading text-2xl text-cocoa mb-1">Vignette Tuner (debug only)</h1>
      <p className="text-cocoa/60 text-sm mb-8">
        Stone: {stone.name}. Not part of the customer site — adjust the sliders, compare across the three shapes below.
        Two shadow bands anchored to the left/right edges, clipped to the real silhouette — they should fade to nothing
        on their own as each shape narrows toward the top and bottom.
      </p>

      <div className="grid grid-cols-3 gap-6 mb-10 bg-cream rounded-2xl p-6">
        <Slider label="Width (fraction of shape's short side)" value={widthFrac} min={0.02} max={0.4} step={0.005} onChange={setWidthFrac} />
        <Slider label="Blur (fraction of shape's short side)" value={blurFrac} min={0.01} max={0.2} step={0.005} onChange={setBlurFrac} />
        <Slider label="Darkness (0-1 opacity)" value={darkness} min={0} max={1} step={0.01} onChange={setDarkness} />
      </div>

      <div className="grid grid-cols-3 gap-8">
        {SHAPES.map((shape) => (
          <div key={shape} className="text-center">
            <p className="text-sm text-cocoa/60 mb-3">{shape}</p>
            <div className="flex justify-center">
              <GemCanvas
                shape={shape}
                stoneColor={stoneColor}
                stoneImageUrl={stone.stoneImageUrl}
                inlayColor="Gold"
                side="front"
                maxWidth={260}
                vignetteWidthFrac={widthFrac}
                vignetteBlurFrac={blurFrac}
                vignetteDarkness={darkness}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
