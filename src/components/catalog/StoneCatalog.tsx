"use client";

import { useMemo, useState } from "react";
import type { Stone } from "@/lib/notion/types";
import { CmsImage } from "@/components/CmsImage";
import { stoneAlt } from "@/lib/altText";
import { COLOR_FAMILY_FALLBACK, COLOR_FAMILY_ORDER } from "@/lib/studio/shapeGeometry";
import Link from "next/link";

const COLOR_OPTIONS = COLOR_FAMILY_ORDER;

// `beginLabel` comes from the Available Gems intro row's CTA Label field in
// Notion — reusing the existing field rather than adding a new one. The
// literal below is only the fallback for an empty Notion cell.
export function StoneCatalog({
  stones,
  betaMode,
  beginLabel = "Begin with this gemstone \u2192",
}: {
  stones: Stone[];
  betaMode: boolean;
  beginLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [readMoreOpen, setReadMoreOpen] = useState<string | null>(null);

  const allThemes = useMemo(() => {
    const set = new Set<string>();
    stones.forEach((s) => s.metaphysicalThemes.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [stones]);

  // Default section grouping is Color Family (not the `Grouping` field, which
  // is empty on every stone in Notion today) — fixed order confirmed with
  // Anthony 2026-07-05, filtered down to only the families actually present.
  const groups = useMemo(
    () => COLOR_FAMILY_ORDER.filter((g) => stones.some((s) => s.colorFamily === g)),
    [stones]
  );

  const filtered = stones.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (colors.length && !colors.includes(s.colorFamily ?? "")) return false;
    if (themes.length && !s.metaphysicalThemes.some((t) => themes.includes(t))) return false;
    return true;
  });

  // Bidirectional "never show them a choice they don't have": a Color pill
  // grays out if zero stones matching the current Feeling selection have that
  // color, and vice versa — but a pill that's already selected stays enabled
  // so it can always be deselected, even if a later choice made it a dead end.
  const stonesForThemeCheck = stones.filter((s) => themes.length === 0 || s.metaphysicalThemes.some((t) => themes.includes(t)));
  const availableColors = new Set(stonesForThemeCheck.map((s) => s.colorFamily).filter((c): c is string => !!c));

  const stonesForColorCheck = stones.filter((s) => colors.length === 0 || colors.includes(s.colorFamily ?? ""));
  const availableThemes = new Set(stonesForColorCheck.flatMap((s) => s.metaphysicalThemes));

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div>
    <div className="max-w-[960px] mx-auto px-6 pt-16 sm:pt-24 pb-8">
      <input
        type="text"
        placeholder="Search available gemstones…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 mb-4 font-body text-cocoa placeholder:text-cocoa/40"
      />

      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 mb-2">View by color</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {COLOR_OPTIONS.map((c) => {
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

      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 mb-2">Filter by feeling</p>
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
    </div>

      {groups.map((group) => {
        const groupStones = filtered.filter((s) => s.colorFamily === group);
        if (groupStones.length === 0) return null;
        return (
          <div key={group} className="max-w-[960px] mx-auto px-6 pb-10 pt-2">
            <h2 className="font-heading text-2xl text-center text-cocoa mb-6">{group}</h2>
            <div className="space-y-3">
              {groupStones.map((stone) => {
                const isReadMoreOpen = readMoreOpen === stone.id;
                const price = betaMode ? stone.betaPrice : stone.launchPrice;
                const isLow =
                  stone.lowStockThreshold != null &&
                  stone.originalQuantity != null &&
                  stone.originalQuantity <= stone.lowStockThreshold;

                return (
                  <div key={stone.id} className="rounded-2xl bg-cream p-4">
                    <button
                      onClick={() => setReadMoreOpen(isReadMoreOpen ? null : stone.id)}
                      className="w-full flex gap-4 text-left"
                    >
                      <div className="relative shrink-0 self-start">
                        <CmsImage
                          src={stone.stoneImageUrl}
                          alt={stoneAlt(stone)}
                          label={stone.name}
                          aspect="aspect-square"
                          className="w-28 h-28 rounded-xl"
                        />
                        <div className="absolute -top-1 -left-1 flex flex-col gap-1">
                          {isLow && (
                            <span className="text-[10px] font-medium bg-cocoa text-warm-white px-1.5 py-0.5 rounded">LIMITED</span>
                          )}
                          {stone.premiumBadge && (
                            <span className="text-[10px] font-medium bg-gold text-warm-white px-1.5 py-0.5 rounded">PREMIUM</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-heading text-lg text-cocoa">{stone.name}</p>
                            <p className="text-sm text-cocoa/60">from ${price}</p>
                          </div>
                          {/* Visual cue only — the whole row is clickable, this isn't its own separate target */}
                          <span className="shrink-0 text-xs uppercase tracking-wide text-gold underline">
                            {isReadMoreOpen ? "Show less" : "Read more"}
                          </span>
                        </div>
                        {/* Meaning leads, description follows — matches the
                            Studio's Stone screen (Anthony's call 2026-07-28).
                            The theme tags stay always-visible as the at-a-glance
                            meaning; the fuller "Its meaning" text stays behind
                            Read more, but now sits above the description so the
                            order reads the same collapsed or expanded. */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stone.metaphysicalThemes.map((t) => (
                            <span key={t} className="text-[11px] text-cocoa/50 bg-cocoa/5 rounded-full px-2 py-0.5">
                              {t}
                            </span>
                          ))}
                        </div>
                        {isReadMoreOpen && (
                          <div className="mt-3">
                            <p className="text-xs uppercase tracking-wide text-gold mb-1">Its meaning</p>
                            <p className="font-body text-cocoa/80 text-sm">{stone.metaphysicalProperties}</p>
                          </div>
                        )}
                        <p className="font-body text-cocoa/80 text-sm mt-3">{stone.stoneDescription}</p>
                      </div>
                    </button>
                    <div className="text-right mt-3">
                      <Link
                        href={`/create-your-remember-me-gem?stone=${encodeURIComponent(stone.name)}`}
                        className="text-blue underline text-sm"
                      >
                        {beginLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
