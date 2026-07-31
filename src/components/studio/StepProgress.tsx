"use client";

import { useStudioStore } from "@/store/studio";
import { copyText } from "@/lib/notion/configuratorCopy";

// Dot-and-line progress bar, rendered once in Studio.tsx so it sits in the same
// place on every screen — including the two that don't use StepShell (Where to
// begin, Review).
//
// The denominator comes from `totalSteps`, locked when the customer entered,
// not from the live step list: a total that changes partway through reads as
// the finish line moving away, which undermines the reassurance the indicator
// exists to give.
//
// Replaced the original plain-text "Step 3 of 8" 2026-07-28 — the text alone
// was too quiet to register. The text stays, centered above the bar.

// Brand gradient endpoints (globals.css). Completed dots pick up a shade
// stepped along gold → blue rather than all being one flat colour, so the bar
// reads as a single gradient sweep filling left to right.
const GRADIENT_FROM = [0xc6, 0xa1, 0x64]; // --color-gold
const GRADIENT_TO = [0x7f, 0xa7, 0xd8]; // --color-blue
const NEUTRAL_TAN = "#e2d7c6";

function gradientShade(position: number): string {
  const t = Math.min(Math.max(position, 0), 1);
  const [r, g, b] = GRADIENT_FROM.map((from, i) => Math.round(from + (GRADIENT_TO[i] - from) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

export function StepProgress({ copy }: { copy: Record<string, string> }) {
  const currentStep = useStudioStore((s) => s.currentStep);
  const stepOrder = useStudioStore((s) => s.stepOrder);
  const totalSteps = useStudioStore((s) => s.totalSteps);

  // The cart screen sits outside the numbered flow, so it has no position.
  const index = stepOrder.indexOf(currentStep);
  if (index < 0) return null;

  const label = copyText(copy, "global_step_progress", "Step {current} of {total}")
    .replace("{current}", String(index + 1))
    .replace("{total}", String(totalSteps));

  // Guard against a one-step flow dividing by zero when spreading the gradient.
  const lastIndex = Math.max(totalSteps - 1, 1);

  return (
    <div className="pt-8">
      <p className="text-center text-xs uppercase tracking-wide text-cocoa/40 mb-3" aria-live="polite">
        {label}
      </p>
      <div className="flex items-center justify-center gap-0 max-w-sm mx-auto px-4" aria-hidden>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isComplete = i <= index;
          // The line to the LEFT of this dot fills only once this dot is
          // reached, so the fill front always sits at the customer's position.
          const lineComplete = i <= index;
          return (
            <div key={i} className={i === 0 ? "flex items-center" : "flex items-center flex-1"}>
              {i > 0 && (
                <div
                  className="h-[3px] flex-1 rounded-full"
                  style={{
                    background: lineComplete ? gradientShade((i - 0.5) / lastIndex) : NEUTRAL_TAN,
                  }}
                />
              )}
              <div
                className="rounded-full shrink-0"
                style={{
                  width: 14,
                  height: 14,
                  background: isComplete ? gradientShade(i / lastIndex) : NEUTRAL_TAN,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
