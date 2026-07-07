"use client";

import { useEffect, useRef } from "react";
import type { ShapeName, Stone, Symbol } from "@/lib/notion/types";
import { useStudioStore } from "@/store/studio";
import { InMemoryOfScreen } from "./screens/InMemoryOfScreen";
import { WhereToBeginScreen } from "./screens/WhereToBeginScreen";
import { CarryTypeScreen } from "./screens/CarryTypeScreen";
import { StoneScreen } from "./screens/StoneScreen";
import { ShapeScreen } from "./screens/ShapeScreen";
import { SymbolScreen } from "./screens/SymbolScreen";
import { InlayScreen } from "./screens/InlayScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { CartScreen } from "./screens/CartScreen";
import { CartBadge } from "./CartBadge";

export function Studio({
  stones,
  symbols,
  betaMode,
  copy,
  deepLinkStone,
  deepLinkShape,
  deepLinkSymbol,
}: {
  stones: Stone[];
  symbols: Symbol[];
  betaMode: boolean;
  copy: Record<string, string>;
  deepLinkStone?: Stone | null;
  deepLinkShape?: ShapeName | null;
  deepLinkSymbol?: Symbol | null;
}) {
  const currentStep = useStudioStore((s) => s.currentStep);
  const setCatalogData = useStudioStore((s) => s.setCatalogData);
  const beginFromDeepLink = useStudioStore((s) => s.beginFromDeepLink);
  const didInit = useRef(false);

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

  return (
    <>
      {currentStep !== "added-to-cart" && <CartBadge />}
      {(() => {
        switch (currentStep) {
          case "in-memory-of":
            return <InMemoryOfScreen copy={copy} />;
          case "where-to-begin":
            return <WhereToBeginScreen copy={copy} />;
          case "carry-type":
            return <CarryTypeScreen copy={copy} />;
          case "stone":
            return <StoneScreen stones={stones} betaMode={betaMode} copy={copy} />;
          case "shape":
            return <ShapeScreen copy={copy} />;
          case "symbol":
            return <SymbolScreen symbols={symbols} copy={copy} />;
          case "inlay":
            return <InlayScreen copy={copy} />;
          case "review":
            return <ReviewScreen betaMode={betaMode} copy={copy} />;
          case "added-to-cart":
            return <CartScreen copy={copy} />;
          default:
            return null;
        }
      })()}
    </>
  );
}
