"use client";

import { useState } from "react";
import Link from "next/link";
import { SHAPES, SHAPE_ADDON_PRICE } from "@/lib/studio/shapes";
import { GemCanvas } from "@/components/studio/GemCanvas";
import type { CarryType } from "@/lib/notion/types";

const CARRY_TYPES: CarryType[] = ["Wear It", "Carry It", "Hang It"];

export function ShapeCatalog() {
  const [filter, setFilter] = useState<CarryType | null>(null);

  const shapes = SHAPES.filter((s) => !filter || s.carryTypes.includes(filter));

  return (
    <div className="max-w-[960px] mx-auto px-6 py-12">
      <p className="text-center text-cocoa/70 italic mb-8">
        Every gem is shaped by hand from these templates, so finished sizes are approximate — no two are ever exactly alike.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-sm border ${!filter ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"}`}
        >
          All
        </button>
        {CARRY_TYPES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm border ${filter === c ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="max-w-[520px] mx-auto space-y-3">
        {shapes.map((shape) => (
          <div key={shape.name} className="rounded-2xl bg-cream p-4 flex items-center gap-4">
            <div className="shrink-0 flex items-center justify-center" style={{ width: 100 }}>
              <GemCanvas shape={shape.name} stoneColor="#AFC4D6" inlayColor="Gold" maxWidth={100} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-lg text-cocoa">{shape.name}</p>
                {shape.petiteAddOn && (
                  <span className="text-[11px] font-medium bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    +${SHAPE_ADDON_PRICE}
                  </span>
                )}
              </div>
              <p className="text-sm text-cocoa/50 mb-1">{shape.approxSize}</p>
              <p className="font-body text-cocoa/80">{shape.description}</p>
              <Link
                href={`/create-your-remember-me-gem?shape=${encodeURIComponent(shape.name)}`}
                className="text-blue underline text-sm"
              >
                Begin with this shape →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
