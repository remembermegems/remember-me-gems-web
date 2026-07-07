import { STROKE_STYLE_SYMBOLS } from "@/lib/studio/shapeGeometry";

// Renders a symbol's SVG path in gold on the cocoa rounded-square tile —
// the default treatment used on the Symbols catalog page and the Studio's
// symbol-selection screen. Cocoa background chosen 2026-07-05 after the
// original blue background tested with poor contrast against the gold path.
export function SymbolTile({
  name,
  path,
  viewBox,
  size = 80,
  fill = "#C6A164",
  bg = "#4E3F35",
}: {
  name: string;
  path: string;
  viewBox: string;
  size?: number;
  fill?: string;
  bg?: string;
}) {
  const strokeWidth = STROKE_STYLE_SYMBOLS[name];

  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: bg }}
    >
      <svg viewBox={viewBox} width={size * 0.55} height={size * 0.55}>
        {strokeWidth ? (
          <path d={path} fill="none" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" />
        ) : (
          <path d={path} fill={fill} fillRule="evenodd" />
        )}
      </svg>
    </div>
  );
}
