"use client";

import { useMemo, useState } from "react";
import type { Symbol } from "@/lib/notion/types";
import { SymbolTile } from "@/components/SymbolTile";
import Link from "next/link";

const GROUP_QUESTIONS: Record<string, string> = {
  "Faith & Belief": "What did they believe?",
  "Love & Connection": "What did you share?",
  "Life & Spirit": "Who were they?",
};

export function SymbolCatalog({ symbols }: { symbols: Symbol[] }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    const set = new Set<string>();
    symbols.forEach((s) => s.grouping.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [symbols]);

  return (
    <div className="max-w-[960px] mx-auto px-6 py-12">
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <button
          onClick={() => setActiveGroup(null)}
          className={`px-3 py-1.5 rounded-full text-sm border ${!activeGroup ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"}`}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-full text-sm border ${activeGroup === g ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"}`}
          >
            {g}
          </button>
        ))}
      </div>

      {groups
        .filter((g) => !activeGroup || activeGroup === g)
        .map((group) => (
          <div key={group} className="mb-10">
            <h2 className="font-heading text-2xl text-center text-cocoa">{group}</h2>
            <p className="text-center text-cocoa/50 italic mb-6">{GROUP_QUESTIONS[group]}</p>
            <div className="max-w-[520px] mx-auto space-y-3">
              {symbols
                .filter((s) => s.grouping.includes(group))
                .map((symbol) => (
                  <div key={symbol.id} className="rounded-2xl bg-cream p-4 flex items-center gap-4">
                    <SymbolTile name={symbol.name} path={symbol.svgPathData} viewBox={symbol.viewBox} size={130} />
                    <div className="flex-1">
                      <p className="font-heading text-lg text-cocoa">{symbol.name}</p>
                      <p className="font-body text-cocoa/80">{symbol.meaning}</p>
                      <Link
                        href={`/create-your-remember-me-gem?symbol=${encodeURIComponent(symbol.name)}`}
                        className="text-blue underline text-sm"
                      >
                        Begin with this symbol →
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
