"use client";

import { useEffect, useRef, useState } from "react";
import { SHAPE_GEOMETRY, INLAY_SWATCH, STROKE_STYLE_SYMBOLS } from "@/lib/studio/shapeGeometry";
import { lighten, darken, ellipseGradientFill } from "@/lib/studio/renderUtils";
import type { ShapeName } from "@/lib/notion/types";

type SymbolInput = { name: string; path: string; viewBox: string } | null;

// Shared across every GemCanvas instance so the same stone photo isn't
// refetched every time it's redrawn (front/back, multiple screens, etc.) —
// ports the render sandbox's IMG_CACHE pattern (rmg_sandbox_v1.html).
const STONE_IMAGE_CACHE = new Map<string, HTMLImageElement>();

function getStoneImage(url: string): HTMLImageElement {
  let img = STONE_IMAGE_CACHE.get(url);
  if (!img) {
    img = new Image();
    // Deliberately no `img.crossOrigin` — Notion's signed S3 URLs don't send
    // CORS headers permitting it, and setting it makes the browser block the
    // request outright (confirmed via net::ERR_FAILED). We never read pixels
    // back off this canvas (no toDataURL/getImageData), so the canvas being
    // "tainted" by a cross-origin draw doesn't matter here.
    img.src = url;
    STONE_IMAGE_CACHE.set(url, img);
  }
  return img;
}

// "Cover" fit — crops to fill the target box instead of stretching, same as
// the sandbox's drawImageCover.
function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) {
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Ports the render sandbox's layered-canvas pipeline (stone -> vignette ->
// inlay -> bevel -> gloss -> single destination-in shape mask -> grommet)
// into React. Additions beyond the sandbox: real per-shape/per-symbol data
// instead of one hardcoded example, and back-of-stone initials rendering,
// which didn't exist in the sandbox at all.
export function GemCanvas({
  shape,
  stoneColor,
  stoneImageUrl,
  inlayColor,
  symbol,
  side = "front",
  initials = "",
  letteringStyle = "Monument",
  maxWidth = 220,
  stoneName,
  alt,
  // Tunable only for the vignette debug harness (web/src/app/studio-debug) —
  // every real call site uses the defaults. Values locked in by Anthony
  // 2026-07-06 via that harness — see [[project-rmg-vignette-render]].
  vignetteWidthFrac = 0.28,
  vignetteBlurFrac = 0.09,
  vignetteDarkness = 0.62,
}: {
  shape: ShapeName;
  // Flat-color fallback — used directly when there's no real stone photo yet
  // (placeholder tiles with no stone selected) and as the fill shown while a
  // real photo is still loading.
  stoneColor: string;
  stoneImageUrl?: string | null;
  inlayColor: keyof typeof INLAY_SWATCH;
  symbol?: SymbolInput;
  side?: "front" | "back";
  initials?: string;
  letteringStyle?: "Flowing Script" | "Monument";
  maxWidth?: number;
  // Used to name the stone in the screen-reader description; falls back to a
  // generic "gemstone" on placeholder tiles where none is chosen yet.
  stoneName?: string;
  // Full override for that description, for call sites where the surrounding
  // copy already says more than this component can infer.
  alt?: string;
  vignetteWidthFrac?: number;
  vignetteBlurFrac?: number;
  vignetteDarkness?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const geo = SHAPE_GEOMETRY[shape];
  const [imgLoadTick, forceRedraw] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const inlay = INLAY_SWATCH[inlayColor] ?? INLAY_SWATCH.Natural;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    canvas.width = geo.W * dpr;
    canvas.height = geo.H * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, geo.W, geo.H);

    const clipRegion = new Path2D(geo.clipPath);

    // LAYER 1: the real stone photo, "cover" fit — falls back to a flat
    // color only when there's no photo yet, or while it's still loading.
    let awaitingImage: (() => void) | undefined;
    const stoneImg = stoneImageUrl ? getStoneImage(stoneImageUrl) : null;
    if (stoneImg && stoneImg.complete && stoneImg.naturalWidth > 0) {
      drawImageCover(ctx, stoneImg, 0, 0, geo.W, geo.H);
    } else {
      ctx.fillStyle = stoneColor;
      ctx.fillRect(0, 0, geo.W, geo.H);
      if (stoneImg) {
        const onLoad = () => forceRedraw((t) => t + 1);
        stoneImg.addEventListener("load", onLoad);
        awaitingImage = () => stoneImg.removeEventListener("load", onLoad);
      }
    }

    // LAYER 2: vignette — two soft shadow bands anchored to the shape's
    // left and right bounding edges, clipped to the actual silhouette.
    // Anthony's correction (2026-07-06, confirmed against real cabochons):
    // the dome curvature only happens on the left/right sides — the top and
    // bottom are cut relatively flat, no shadow belongs there at all. A
    // constant-width stroke traced around the WHOLE outline (the previous
    // attempt) doesn't achieve that: near a narrow tip, a fixed stroke width
    // covers proportionally more of the local cross-section than it does at
    // the wide equator, so it reads as solid shadow at the tip instead of a
    // thin edge line. Anchoring two bands to the bounding box's left/right
    // edges sidesteps that entirely — where the silhouette is at its widest
    // (the equator) the bands sit inside real stone and show fully; as the
    // outline narrows approaching the top/bottom, it retreats past the
    // bands' inner edge and the clip removes the shadow automatically, no
    // separate top/bottom exclusion setting needed.
    const vignetteScale = Math.min(geo.W, geo.H);
    const bandW = vignetteScale * vignetteWidthFrac;
    ctx.save();
    ctx.clip(clipRegion);
    ctx.filter = `blur(${vignetteScale * vignetteBlurFrac}px)`;
    ctx.globalCompositeOperation = "multiply";

    const leftGrad = ctx.createLinearGradient(0, 0, bandW, 0);
    leftGrad.addColorStop(0, `rgba(0,0,0,${vignetteDarkness})`);
    leftGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, bandW, geo.H);

    const rightGrad = ctx.createLinearGradient(geo.W - bandW, 0, geo.W, 0);
    rightGrad.addColorStop(0, "rgba(0,0,0,0)");
    rightGrad.addColorStop(1, `rgba(0,0,0,${vignetteDarkness})`);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(geo.W - bandW, 0, bandW, geo.H);

    ctx.restore();

    // LAYERS 3/4: inlay — symbol on the front, initials on the back. Flush
    // with the stone surface, no groove/shadow (confirmed against a real
    // reference photo — see the render engine memory).
    const zone = geo.symZone;
    if (side === "front" && symbol) {
      const [vx, vy, vw, vh] = symbol.viewBox.split(/\s+/).map(Number);
      const aspect = vw / vh;
      let sW: number, sH: number;
      if (zone.w / zone.h > aspect) {
        sH = zone.h;
        sW = sH * aspect;
      } else {
        sW = zone.w;
        sH = sW / aspect;
      }
      const offX = zone.x + (zone.w - sW) / 2;
      const offY = zone.y + (zone.h - sH) / 2;

      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(sW / vw, sH / vh);
      ctx.translate(-vx, -vy);
      const grad = ctx.createLinearGradient(vx, vy, vx + vw * 0.9, vy + vh);
      grad.addColorStop(0, lighten(inlay.hex, 22));
      grad.addColorStop(1, darken(inlay.hex, 22));
      const strokeWidth = STROKE_STYLE_SYMBOLS[symbol.name];
      if (strokeWidth) {
        ctx.strokeStyle = grad;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.stroke(new Path2D(symbol.path));
      } else {
        ctx.clip(new Path2D(symbol.path), "evenodd");
        ctx.fillStyle = grad;
        ctx.fillRect(vx - vw, vy - vh, vw * 3, vh * 3);
      }
      ctx.restore();
    } else if (side === "back" && initials) {
      const fontFamily = letteringStyle === "Flowing Script" ? "'Brush Script MT', cursive" : "'Arial Black', sans-serif";
      const cx = zone.x + zone.w / 2;
      const cy = zone.y + zone.h / 2;
      const text = initials.toUpperCase();

      // Vertical shapes swap which zone dimension constrains font size vs.
      // line length, since the text gets rotated 90° into the zone's tall
      // axis instead of its wide one.
      const vertical = Boolean(geo.initialsVertical);
      const sizeDim = vertical ? zone.w : zone.h;
      const lengthDim = vertical ? zone.h : zone.w;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Shrink-to-fit: the zone's cross dimension sets a starting size, then
      // measured text width is clamped against the zone's long dimension —
      // this is what was missing before, letting long initials overflow.
      let fontSize = sizeDim * 0.42;
      ctx.font = `${fontSize}px ${fontFamily}`;
      const measuredWidth = ctx.measureText(text).width;
      const maxWidth = lengthDim * 0.92;
      if (measuredWidth > maxWidth) {
        fontSize *= maxWidth / measuredWidth;
        ctx.font = `${fontSize}px ${fontFamily}`;
      }

      // Hard clip to the engraving zone itself as a safety net, regardless
      // of the shrink-to-fit math above.
      ctx.beginPath();
      ctx.rect(zone.x, zone.y, zone.w, zone.h);
      ctx.clip();

      ctx.translate(cx, cy);
      if (vertical) ctx.rotate(Math.PI / 2);

      const grad = ctx.createLinearGradient(-zone.w / 2, -zone.h / 2, zone.w * 0.4, zone.h / 2);
      grad.addColorStop(0, lighten(inlay.hex, 22));
      grad.addColorStop(1, darken(inlay.hex, 22));
      ctx.fillStyle = grad;
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    // LAYER 5: bevel
    ellipseGradientFill(
      ctx, 0.28, 0.18, 0.68, geo.W, geo.H,
      [[0, "rgba(255,255,255,0.28)"], [0.45, "rgba(255,255,255,0.03)"], [0.68, "rgba(255,255,255,0)"]]
    );

    // LAYER 6: dome gloss — soft-light avoids blowout at a pointed tip
    ellipseGradientFill(
      ctx, 0.5, 0.15, 0.55, geo.W, geo.H,
      [[0, "rgba(255,255,255,0.30)"], [0.35, "rgba(255,255,255,0.08)"], [0.55, "rgba(255,255,255,0)"]],
      "soft-light"
    );

    // Mask to the shape outline exactly once, as the final step — avoids
    // anti-aliasing artifacts compounding from repeated per-layer clipping.
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "#000";
    ctx.fill(clipRegion);
    ctx.globalCompositeOperation = "source-over";

    // GROMMET — not clipped, sits above the shape. Touchstones have none.
    // Metal matches the selected inlay (gold inlay/natural -> gold grommet;
    // silver/white/turquoise -> silver grommet).
    if (geo.hasGrommet) {
      const gr = geo.grometR;
      const cx = geo.grometX;
      const cy = geo.grometY;
      const metalBase = inlay.grommetMetal === "gold" ? "#C9A24B" : "#C7CDD4";

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.fillStyle = "#0d0b08";
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, gr * 0.98, 0, Math.PI * 2);
      ctx.arc(cx, cy, gr * 0.46, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      const ringGrad = ctx.createLinearGradient(cx - gr, cy - gr, cx + gr, cy + gr);
      ringGrad.addColorStop(0, lighten(metalBase, 30));
      ringGrad.addColorStop(1, darken(metalBase, 20));
      ctx.fillStyle = ringGrad;
      ctx.fillRect(cx - gr, cy - gr, gr * 2, gr * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, gr * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = "#060504";
      ctx.fill();
      ctx.restore();
    }

    return awaitingImage;
  }, [
    shape,
    stoneColor,
    stoneImageUrl,
    inlayColor,
    symbol,
    side,
    initials,
    letteringStyle,
    geo,
    imgLoadTick,
    vignetteWidthFrac,
    vignetteBlurFrac,
    vignetteDarkness,
  ]);

  const scale = Math.min(1, maxWidth / geo.W);

  // A canvas is an empty box to a screen reader — everything this component
  // draws is invisible to one. Describing the gem in words, rebuilt from the
  // same props that drive the render, means the central artifact of the whole
  // product is actually announced, and re-announced whenever the customer
  // changes a choice.
  // alt="" marks the canvas decorative — used where it sits inside a control
  // whose own text already names the thing, so a screen reader doesn't read
  // the same shape twice.
  const decorative = alt === "";
  const describedStone = stoneName ?? "gemstone";
  const description =
    alt ||
    (side === "front"
      ? `${describedStone} ${shape} gem, front${symbol ? `, with the ${symbol.name} symbol inlaid in ${inlayColor.toLowerCase()}` : ""}.`
      : `${describedStone} ${shape} gem, back${
          initials
            ? `, engraved with the initials ${initials.split("").join(" ")} in ${letteringStyle.toLowerCase()} lettering`
            : ", with no initials engraved"
        }.`);

  return (
    <div style={{ width: geo.W * scale, height: geo.H * scale, overflow: "hidden" }}>
      <canvas
        ref={ref}
        {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": description })}
        style={{ width: geo.W, height: geo.H, transform: `scale(${scale})`, transformOrigin: "top left" }}
      />
    </div>
  );
}
