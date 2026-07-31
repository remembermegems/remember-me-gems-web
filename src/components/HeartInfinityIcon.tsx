import { FALLBACK_SYMBOL } from "@/lib/studio/shapeGeometry";

// Shared Eternal Love mark, used as the small
// accent above pull quotes, and the brand mark in the footer. Renders the
// real Symbol Library path data (same source as the footer, same compound
// outer-contour-plus-holes shape filled with fill-rule evenodd — see the
// Infinity Symbol rendering fix for why evenodd matters here) instead of the
// old two-heart placeholder line art, so all three places show the actual
// Eternal Love glyph rather than a stand-in shape.
export function HeartInfinityIcon({
  className = "",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox={`0 0 ${FALLBACK_SYMBOL.aspectW} ${FALLBACK_SYMBOL.aspectH}`} className={className} aria-hidden>
      <path d={FALLBACK_SYMBOL.path} fill={color} fillRule="evenodd" />
    </svg>
  );
}
