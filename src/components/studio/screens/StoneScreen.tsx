"use client";

import { Fragment, useMemo, useState } from "react";
import type { Stone } from "@/lib/notion/types";
import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { CmsImage } from "@/components/CmsImage";
import { availableStones } from "@/lib/studio/filters";
import { COLOR_FAMILY_FALLBACK, COLOR_FAMILY_ORDER } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";

export function StoneScreen({
  stones,
  betaMode,
  copy,
}: {
  stones: Stone[];
  betaMode: boolean;
  copy: Record<string, string>;
}) {
  const store = useStudioStore();
  const [search, setSearch] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(store.stone?.id ?? null);

  const filterableByShape = availableStones(stones, store.shape);

  // Default grouping is Color Family, matching Available Gemstones exactly
  // (reversed 2026-07-05 from the earlier "independent of Grouping" read —
  // Anthony wants both screens' groupings unified).
  const groups = useMemo(
    () => COLOR_FAMILY_ORDER.filter((g) => filterableByShape.some((s) => s.colorFamily === g)),
    [filterableByShape]
  );

  const allThemes = useMemo(() => {
    const set = new Set<string>();
    filterableByShape.forEach((s) => s.metaphysicalThemes.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [filterableByShape]);

  const filtered = filterableByShape.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (colors.length && !colors.includes(s.colorFamily ?? "")) return false;
    if (themes.length && !s.metaphysicalThemes.some((t) => themes.includes(t))) return false;
    return true;
  });

  // Bidirectional "never show them a choice they don't have" — same pattern
  // as Available Gemstones.
  const stonesForThemeCheck = filterableByShape.filter((s) => themes.length === 0 || s.metaphysicalThemes.some((t) => themes.includes(t)));
  const availableColors = new Set(stonesForThemeCheck.map((s) => s.colorFamily).filter((c): c is string => !!c));

  const stonesForColorCheck = filterableByShape.filter((s) => colors.length === 0 || colors.includes(s.colorFamily ?? ""));
  const availableThemes = new Set(stonesForColorCheck.flatMap((s) => s.metaphysicalThemes));

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <StepShell
      headline={copyText(copy, "stone_headline", "Choose their gemstone")}
      subhead={copyText(
        copy,
        "stone_subtitle",
        "Each stone formed over millions of years, and no two are ever alike. Choose the one that feels like them."
      )}
      copy={copy}
      onBack={store.goBack}
    >
      <input
        type="text"
        placeholder={copyText(copy, "stone_search_placeholder", "Search available gemstones…")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 mb-4 font-body"
      />

      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 mb-2">{copyText(copy, "stone_filter_color_label", "View by color")}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {COLOR_FAMILY_ORDER.map((c) => {
            const isSelected = colors.includes(c);
            const isDisabled = !isSelected && !availableColors.has(c);
            return (
              <button
                key={c}
                onClick={() => toggle(colors, setColors, c)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
                  isSelected
                    ? "bg-cocoa text-warm-white border-cocoa"
                    : isDisabled
                      ? "border-cocoa/10 text-cocoa/30 cursor-not-allowed"
                      : "border-cocoa/20 text-cocoa/70"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLOR_FAMILY_FALLBACK[c] ?? "#8d8380", opacity: isDisabled ? 0.4 : 1 }}
                  aria-hidden
                />
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 mb-2">{copyText(copy, "stone_filter_feeling_label", "Filter by feeling")}</p>
        <div className="flex flex-wrap gap-2">
          {allThemes.map((t) => {
            const isSelected = themes.includes(t);
            const isDisabled = !isSelected && !availableThemes.has(t);
            return (
              <button
                key={t}
                onClick={() => toggle(themes, setThemes, t)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  isSelected
                    ? "bg-gold text-warm-white border-gold"
                    : isDisabled
                      ? "border-cocoa/10 text-cocoa/30 cursor-not-allowed"
                      : "border-cocoa/20 text-cocoa/70"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {groups.map((group) => {
        const groupStones = filtered.filter((s) => s.colorFamily === group);
        if (groupStones.length === 0) return null;
        const openStone = groupStones.find((s) => s.id === expanded);
        return (
          <div key={group} className="mb-8">
            <h3 className="font-heading text-xl text-center text-cocoa mb-4">{group}</h3>
            {/* The expanded panel is rendered as a full-width grid item placed
                right after the selected tile (not appended after the whole
                grid), so it lands directly under that tile's row and reads as
                one continuous card with it — no gap, no separate box. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {groupStones.map((stone) => {
                const isSelected = store.stone?.id === stone.id;
                const price = betaMode ? stone.betaPrice : stone.launchPrice;
                // Same LIMITED/PREMIUM badge logic as Available Gemstones —
                // was only ever built on the marketing page, missing here
                // despite being a locked Studio/site parity decision.
                const isLow =
                  stone.lowStockThreshold != null &&
                  stone.originalQuantity != null &&
                  stone.originalQuantity <= stone.lowStockThreshold;
                return (
                  <Fragment key={stone.id}>
                    <button
                      onClick={() => {
                        store.setStone(stone);
                        setExpanded(stone.id);
                      }}
                      className={`text-left p-2 transition-colors ${isSelected ? "bg-warm-white rounded-t-2xl" : "bg-cream rounded-2xl hover:bg-dusty-sky/20"}`}
                    >
                      <div className="relative">
                        <CmsImage src={stone.stoneImageUrl} alt={stone.name} label={stone.name} className="w-full aspect-square rounded-xl" />
                        <div className="absolute -top-1 -left-1 flex flex-col gap-1">
                          {isLow && (
                            <span className="text-[10px] font-medium bg-cocoa text-warm-white px-1.5 py-0.5 rounded uppercase">
                              {copyText(copy, "stone_badge_limited", "Limited")}
                            </span>
                          )}
                          {stone.premiumBadge && (
                            <span className="text-[10px] font-medium bg-gold text-warm-white px-1.5 py-0.5 rounded uppercase">
                              {copyText(copy, "stone_badge_premium", "Premium")}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 bg-gold text-warm-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="font-heading text-sm text-cocoa mt-2 truncate">{stone.name}</p>
                      <p className="text-xs text-cocoa/60">
                        {copyText(copy, "stone_price_prefix", "from")} ${price}
                      </p>
                    </button>
                    {isSelected && openStone && (
                      <div className="col-span-2 sm:col-span-4 bg-warm-white rounded-b-2xl p-6 -mt-3">
                        <div className="flex items-baseline justify-between gap-3 mb-4">
                          <p className="font-heading text-2xl text-cocoa">{openStone.name}</p>
                          <p className="font-body italic text-gold">
                            {copyText(copy, "stone_price_prefix", "from")} ${betaMode ? openStone.betaPrice : openStone.launchPrice}
                          </p>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-gold mb-1">{copyText(copy, "stone_info_about", "About this stone")}</p>
                        <p className="font-body text-cocoa/80 mb-3">{openStone.stoneDescription}</p>
                        <p className="text-xs uppercase tracking-wide text-gold mb-1">{copyText(copy, "stone_info_meta", "Its meaning")}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {openStone.metaphysicalThemes.map((t) => (
                            <span key={t} className="text-[11px] text-cocoa/50 bg-cocoa/5 rounded-full px-2 py-0.5">
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="font-body text-cocoa/80 mb-4">{openStone.metaphysicalProperties}</p>
                        <div className="flex justify-end">
                          <button
                            onClick={store.goNext}
                            className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa"
                          >
                            {copyText(copy, "global_next_btn", "Continue")}
                          </button>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* New — Notion already had stone_special_request_link ready (matching
          Symbol's existing link), but this screen never actually had one. */}
      <p className="text-center text-sm mt-6">
        <a href="/special-requests" className="text-blue underline">
          {copyText(copy, "stone_special_request_link", "Not seeing a gemstone that fits? Make a special request")}
        </a>
      </p>
    </StepShell>
  );
}
