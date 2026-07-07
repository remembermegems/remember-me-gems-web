import { HeartInfinityIcon } from "./HeartInfinityIcon";

// Eternal Love mark, positioned like a tilted "bow" in a section's top
// corner. Opacity locked at 0.65 per Anthony 2026-07-07 — the original 0.06
// was invisible in practice (he thought the whole feature had been lost).
export function Watermark({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <HeartInfinityIcon
      className={`pointer-events-none absolute top-6 ${side === "left" ? "left-6 -rotate-6" : "right-6 rotate-6"} w-24 h-16 opacity-[0.65]`}
      color="#4E3F35"
    />
  );
}

// A biconvex-lens section: both edges bulge OUTWARD in this section's own
// color, intruding into whichever plain section sits above/below it — so
// the lens section itself reads as a lens wedged between flat neighbors,
// rather than every seam repeating the same one-directional curve. Anthony
// confirmed the curve's own degree/steepness was already right; what was
// missing was this top+bottom pairing, applied to alternating sections only
// (not every section — the in-between ones stay flat and simply get
// intruded upon).
function LensEdge({ position, fill }: { position: "top" | "bottom"; fill: string }) {
  return (
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute left-0 w-full h-12 sm:h-20 z-10 ${position === "top" ? "top-0 -translate-y-full" : "bottom-0 translate-y-full"}`}
      aria-hidden
    >
      {position === "top" ? (
        <path d="M0 80 Q600 0 1200 80 L1200 80 L0 80 Z" fill={fill} />
      ) : (
        <path d="M0 0 Q600 80 1200 0 L1200 0 L0 0 Z" fill={fill} />
      )}
    </svg>
  );
}

export function WatermarkSection({
  side,
  tint = "cream",
  lens = true,
  watermark = true,
  className = "",
  children,
}: {
  side: "left" | "right";
  tint?: "cream" | "white";
  // true/false = both edges (the usual case); "top"/"bottom" = a single edge,
  // for a section with nothing plain above/below it to intrude into — e.g. a
  // page's very first section, which has only the nav above it, not another
  // section it should bulge a curve into.
  lens?: boolean | "top" | "bottom";
  watermark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const fill = tint === "cream" ? "#F7F2EA" : "#FFFDF9";
  return (
    <section className={`relative ${tint === "cream" ? "bg-cream" : "bg-warm-white"} ${className}`}>
      {watermark && <Watermark side={side} />}
      {children}
      {(lens === true || lens === "top") && <LensEdge position="top" fill={fill} />}
      {(lens === true || lens === "bottom") && <LensEdge position="bottom" fill={fill} />}
    </section>
  );
}
