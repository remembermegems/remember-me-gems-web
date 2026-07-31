"use client";

import type { Symbol } from "@/lib/notion/types";
import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { SymbolTile } from "@/components/SymbolTile";
import { SelectionContinue, SelectedBadge } from "../SelectionContinue";
import { availableSymbols } from "@/lib/studio/filters";
import { copyText } from "@/lib/notion/configuratorCopy";

const GROUP_QUESTIONS: Record<string, string> = {
  "Faith & Belief": "What did they believe?",
  "Love & Connection": "What did you share?",
  "Life & Spirit": "Who were they?",
};

export function SymbolScreen({ symbols, copy }: { symbols: Symbol[]; copy: Record<string, string> }) {
  const store = useStudioStore();
  const filtered = availableSymbols(symbols, store.shape);

  const groups = Array.from(new Set(filtered.flatMap((s) => s.grouping)));

  return (
    <StepShell
      headline={copyText(copy, "symbol_headline", "Choose their symbol")}
      subhead={copyText(copy, "symbol_subtitle", "")}
      copy={copy}
      onBack={store.goBack}
    >
      {/* Signals that a tile does double duty (selects AND expands) —
          nothing else on screen says so before the first tap. */}
      <p className="text-center font-body text-sm text-cocoa/50 mb-4">
        {copyText(copy, "symbol_tap_hint", "Tap a symbol to select")}
      </p>
      {groups.map((group) => (
        <div key={group} className="mb-8">
          <h3 className="font-heading text-xl text-center text-cocoa">{group}</h3>
          <p className="text-center text-cocoa/50 italic text-sm mb-4">{GROUP_QUESTIONS[group]}</p>
          <div className="space-y-3">
            {filtered
              .filter((s) => s.grouping.includes(group))
              .map((symbol) => {
                const isSelected = store.symbol?.id === symbol.id;
                return (
                  <div
                    key={symbol.id}
                    className={`rounded-2xl transition-colors ${
                      isSelected ? "bg-warm-white ring-[3px] ring-gold shadow-md" : "bg-cream hover:bg-dusty-sky/20"
                    }`}
                  >
                    <button
                      onClick={() => store.setSymbol(symbol)}
                      aria-pressed={isSelected}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <SymbolTile name={symbol.name} path={symbol.svgPathData} viewBox={symbol.viewBox} size={64} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-heading text-lg text-cocoa">{symbol.name}</p>
                          {isSelected && <SelectedBadge />}
                        </div>
                        <p className="font-body text-cocoa/70 text-sm">{symbol.meaning}</p>
                      </div>
                    </button>
                    {isSelected && <SelectionContinue onContinue={store.goNext} copy={copy} className="px-4 pb-4" />}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      <p className="text-center text-sm mt-6">
        <a href="/special-requests" className="text-blue underline">
          {copyText(copy, "symbol_special_request_link", "Not seeing a symbol that fits? Make a special request")}
        </a>
      </p>
    </StepShell>
  );
}
