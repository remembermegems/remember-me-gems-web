"use client";

import { useEffect, useRef } from "react";
import type { ShapeName, Stone, Symbol } from "@/lib/notion/types";
import { useStudioStore } from "@/store/studio";
import { WhereToBeginScreen } from "./screens/WhereToBeginScreen";
import { CarryTypeScreen } from "./screens/CarryTypeScreen";
import { StoneScreen } from "./screens/StoneScreen";
import { ShapeScreen } from "./screens/ShapeScreen";
import { SymbolScreen } from "./screens/SymbolScreen";
import { InlayScreen } from "./screens/InlayScreen";
import { DedicationScreen } from "./screens/DedicationScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { CartScreen } from "./screens/CartScreen";
import { CartBadge } from "./CartBadge";
import { StepProgress } from "./StepProgress";
import { trackStepView } from "@/lib/analytics";

// Breathing room above the Studio when a step change scrolls it into view.
// Also the hook to raise if a sticky site header is ever added — this is the
// number that keeps the heading from tucking underneath it.
const SCROLL_OFFSET = 16;

export function Studio({
  stones,
  symbols,
  betaMode,
  copy,
  images = {},
  deepLinkStone,
  deepLinkShape,
  deepLinkSymbol,
}: {
  stones: Stone[];
  symbols: Symbol[];
  betaMode: boolean;
  copy: Record<string, string>;
  // Key -> Image URL, for the couple of Studio tile photos that live on the
  // Configurator Copy database rather than a dedicated field elsewhere.
  images?: Record<string, string>;
  deepLinkStone?: Stone | null;
  deepLinkShape?: ShapeName | null;
  deepLinkSymbol?: Symbol | null;
}) {
  const currentStep = useStudioStore((s) => s.currentStep);
  const setCatalogData = useStudioStore((s) => s.setCatalogData);
  const beginFromDeepLink = useStudioStore((s) => s.beginFromDeepLink);
  const didInit = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const didMountStep = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setCatalogData(stones, symbols);
    if (deepLinkStone) beginFromDeepLink("stone", deepLinkStone);
    else if (deepLinkShape) beginFromDeepLink("shape", deepLinkShape);
    else if (deepLinkSymbol) beginFromDeepLink("symbol", deepLinkSymbol);
    // Runs once on mount — the deep-link props come from a server-resolved
    // URL query param and don't change during the Studio session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swapping steps is a state change, not a real navigation, so the browser
  // never resets scroll — customers landed mid-screen (often past the heading
  // entirely) after every press, worst on mobile where screens are tallest.
  // Scroll to the top of the Studio container itself rather than the window,
  // so the new screen's heading is always the first thing read and any
  // chrome above the Studio stays clear.
  useEffect(() => {
    if (!didMountStep.current) {
      didMountStep.current = true;
      return; // don't yank the page on first paint
    }
    const el = containerRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }, [currentStep]);

  // GA4 funnel tracking (punch list #29). Watching `currentStep` here rather
  // than firing from each screen means every route into a step is counted
  // once — Continue, Back, a Review "Change" link, a deep-link entry, and the
  // auto-skip when a step has only one available option.
  useEffect(() => {
    const { stepOrder, totalSteps } = useStudioStore.getState();
    const index = stepOrder.indexOf(currentStep);
    // The cart screen sits outside the numbered flow — it has no step number,
    // and counting it would distort the funnel.
    if (index < 0) return;
    trackStepView({
      step_name: currentStep,
      step_number: index + 1,
      total_steps: totalSteps,
      entry_type: stepOrder.includes("where-to-begin") ? "fresh" : "deep_link",
    });
  }, [currentStep]);

  return (
    <div ref={containerRef}>
      {currentStep !== "added-to-cart" && <CartBadge />}
      <StepProgress copy={copy} />
      {(() => {
        switch (currentStep) {
          case "where-to-begin":
            return <WhereToBeginScreen copy={copy} images={images} />;
          case "carry-type":
            return <CarryTypeScreen copy={copy} images={images} />;
          case "stone":
            return <StoneScreen stones={stones} betaMode={betaMode} copy={copy} />;
          case "shape":
            return <ShapeScreen copy={copy} />;
          case "symbol":
            return <SymbolScreen symbols={symbols} copy={copy} />;
          case "inlay":
            return <InlayScreen copy={copy} />;
          case "dedication":
            return <DedicationScreen copy={copy} />;
          case "review":
            return <ReviewScreen betaMode={betaMode} copy={copy} />;
          case "added-to-cart":
            return <CartScreen copy={copy} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}
