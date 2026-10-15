"use client";

import { useCallback, useRef, useState } from "react";
import { GemCanvas, type SymbolInput } from "./GemCanvas";
import type { InlayColor, ShapeName } from "@/lib/notion/types";

// Renders one visually hidden, capture-only GemCanvas and uploads it as a PNG
// onto the matching Notion order row (punch list #31, Notion-snapshot half —
// the separate Shopify order-confirmation-email half stays blocked on #34's
// Files API scope). Front side only: enough to confirm "this is what I
// designed" without doubling the work for a back-of-stone shot too.
//
// Deliberately a separate GemCanvas instance from the customer-visible ones
// on the order-confirmed page, loading the stone photo through
// /api/studio/image-proxy instead of Notion's direct URL — see the long
// comment in GemCanvas.tsx (found 2026-08-26): a canvas drawn from Notion's
// signed S3 URL is cross-origin-tainted, so calling toDataURL() on it throws
// a SecurityError. Proxying through our own origin sidesteps that instead of
// changing the shared, already-hard-won render path everyone else uses.
export function GemSnapshotCapture({
  pageId,
  shape,
  stoneColor,
  stoneImageUrl,
  inlayColor,
  symbol,
}: {
  // Null skips capture entirely — no Notion row to attach to (e.g. NOTION_TOKEN
  // unset locally, or the order write itself failed upstream).
  pageId: string | null;
  shape: ShapeName;
  stoneColor: string;
  stoneImageUrl?: string | null;
  inlayColor: InlayColor;
  symbol?: SymbolInput;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sent, setSent] = useState(false);

  const handleRender = useCallback(() => {
    if (sent || !pageId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSent(true); // once — GemCanvas's effect can re-run for unrelated reasons

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (err) {
      console.warn("[GemSnapshotCapture] toDataURL failed", err);
      return;
    }

    fetch("/api/orders/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, dataUrl }),
    }).catch((err) => console.warn("[GemSnapshotCapture] upload failed", err));
  }, [sent, pageId]);

  if (!pageId) return null;

  return (
    <div aria-hidden style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", left: -9999, top: -9999 }}>
      <GemCanvas
        shape={shape}
        stoneColor={stoneColor}
        stoneImageUrl={stoneImageUrl ? `/api/studio/image-proxy?url=${encodeURIComponent(stoneImageUrl)}` : null}
        inlayColor={inlayColor}
        symbol={symbol}
        side="front"
        maxWidth={480}
        canvasRef={canvasRef}
        onRender={handleRender}
      />
    </div>
  );
}
