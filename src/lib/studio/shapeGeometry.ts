import type { ShapeName } from "@/lib/notion/types";

// Ported verbatim from the render sandbox's SHAPES table (Configurator
// deploys/rmg_sandbox_v1.html) — real vector geometry traced from Anthony's
// SVG shape templates, just re-keyed from the old internal ids to the
// locked customer-facing shape names.
export type ShapeGeometry = {
  W: number;
  H: number;
  clipPath: string;
  hasGrommet: boolean;
  grometX: number;
  grometY: number;
  grometR: number;
  symZone: { x: number; y: number; w: number; h: number };
  // Back-engraving initials stand vertically (rotated 90°) on these narrow
  // shapes only — an explicit call from Anthony, not derived from the
  // symZone aspect ratio (his judgment on which shapes read fine with
  // horizontal initials doesn't reduce to a simple ratio rule). Defaults to
  // horizontal when omitted.
  initialsVertical?: boolean;
};

export const SHAPE_GEOMETRY: Record<ShapeName, ShapeGeometry> = {
  Shield: {
    W: 210.9, H: 340.16,
    clipPath: "M105.449 0.000C175.704 88.557 212.982 198.787 210.898 311.808C145.680 349.608 65.218 349.608 0.000 311.808C-2.085 198.787 35.193 88.557 105.449 0.000Z",
    hasGrommet: true, grometX: 104.63, grometY: 47.83, grometR: 10.2,
    symZone: { x: 47.52, y: 93.16, w: 115.62, h: 230.0 },
  },
  Arrow: {
    W: 210.9, H: 340.16,
    clipPath: "M104.656 340.157C34.814 251.273-1.950 140.871 0.661 27.860C66.055-9.635 146.516-9.261 211.557 28.843C213.115 141.873 175.324 251.928 104.656 340.157Z",
    hasGrommet: true, grometX: 103.79, grometY: 23.07, grometR: 10.2,
    symZone: { x: 35.02, y: 49.44, w: 137.66, h: 229.46 },
  },
  Teardrop: {
    W: 149.67, H: 231.31,
    clipPath: "M74.835 0.000C89.802 0.000 149.669 95.244 149.669 156.473C149.669 197.802 116.165 231.307 74.835 231.307C33.505 231.307 0.000 197.802 0.000 156.473C0.000 95.244 59.868 0.000 74.835 0.000Z",
    hasGrommet: true, grometX: 74.83, grometY: 27.21, grometR: 10.2,
    symZone: { x: 28.82, y: 64.55, w: 93.59, h: 149.68 },
  },
  "Keepsake Square": {
    W: 170.08, H: 190.49,
    clipPath: "M0.000 0.000L170.079 0.000L170.079 0.000L170.079 190.488L170.079 190.488L0.000 190.488L0.000 190.488L0.000 0.000L0.000 0.000Z",
    hasGrommet: true, grometX: 85.04, grometY: 18.73, grometR: 10.2,
    symZone: { x: 13.26, y: 42.59, w: 143.14, h: 131.86 },
  },
  "Keepsake Rectangle": {
    W: 204.09, H: 272.13,
    clipPath: "M0.000 0.000L204.095 0.000L204.095 0.000L204.095 272.126L204.095 272.126L0.000 272.126L0.000 272.126L0.000 0.000L0.000 0.000Z",
    hasGrommet: true, grometX: 102.48, grometY: 26.02, grometR: 10.2,
    symZone: { x: 23.81, y: 48.97, w: 156.16, h: 207.41 },
  },
  "Classic Oval": {
    W: 129.26, H: 299.34,
    clipPath: "M0.000 149.669C0.000 67.009 28.936 0.000 64.630 0.000C100.324 0.000 129.260 67.009 129.260 149.669C129.260 232.329 100.324 299.338 64.630 299.338C28.936 299.338 0.000 232.329 0.000 149.669Z",
    hasGrommet: true, grometX: 64.19, grometY: 27.21, grometR: 10.2,
    symZone: { x: 15.28, y: 60.06, w: 99.01, h: 184.04 },
    initialsVertical: true,
  },
  "Slim Oval": {
    W: 115.65, H: 251.72,
    clipPath: "M0.000 125.858C0.000 56.349 25.890 0.000 57.827 0.000C89.764 0.000 115.654 56.349 115.654 125.858C115.654 195.368 89.764 251.717 57.827 251.717C25.890 251.717 0.000 195.368 0.000 125.858Z",
    hasGrommet: true, grometX: 57.83, grometY: 27.21, grometR: 10.2,
    symZone: { x: 18.28, y: 49.46, w: 78.72, h: 161.89 },
    initialsVertical: true,
  },
  "Petite Rectangle": {
    W: 122.46, H: 204.09,
    clipPath: "M 0,0 L 122.457,0 L 122.457,204.095 L 0,204.095 Z",
    hasGrommet: true, grometX: 60.55, grometY: 20.22, grometR: 10.2,
    symZone: { x: 7.35, y: 42.59, w: 107.03, h: 148.93 },
    initialsVertical: true,
  },
  "Tall Rectangle": {
    W: 122.46, H: 292.54,
    clipPath: "M0.000 0.000L122.457 0.000L122.457 0.000L122.457 292.536L122.457 292.536L0.000 292.536L0.000 292.536L0.000 0.000L0.000 0.000Z",
    hasGrommet: true, grometX: 61.23, grometY: 27.21, grometR: 10.2,
    symZone: { x: 7.35, y: 63.03, w: 107.04, h: 201.36 },
    initialsVertical: true,
  },
  "Petite Dog Tag": {
    W: 163.96, H: 244.91,
    clipPath: "M44.220 3.402L119.736 3.402C142.279 3.402 160.554 21.677 160.554 44.220L160.554 200.693C160.554 223.236 142.279 241.512 119.736 241.512L44.220 241.512C21.677 241.512 3.402 223.236 3.402 200.693L3.402 44.220C3.402 21.677 21.677 3.402 44.220 3.402Z",
    hasGrommet: true, grometX: 79.82, grometY: 24.74, grometR: 10.2,
    symZone: { x: 13.59, y: 45.59, w: 135.4, h: 174.57 },
  },
  "Dog Tag": {
    W: 231.31, H: 346.96,
    clipPath: "M64.630 3.402L166.677 3.402C200.493 3.402 227.905 30.814 227.905 64.630L227.905 282.329C227.905 316.145 200.493 343.558 166.677 343.558L64.630 343.558C30.814 343.558 3.402 316.145 3.402 282.329L3.402 64.630C3.402 30.814 30.814 3.402 64.630 3.402Z",
    hasGrommet: true, grometX: 111.69, grometY: 32.77, grometR: 10.2,
    symZone: { x: 24.83, y: 62.25, w: 182.08, h: 250.87 },
  },
  "Oval Palm Stone": {
    W: 217.7, H: 374.17,
    clipPath: "M0.000 187.087C0.000 83.761 48.734 0.000 108.850 0.000C168.967 0.000 217.701 83.761 217.701 187.087C217.701 290.412 168.967 374.174 108.850 374.174C48.734 374.174 0.000 290.412 0.000 187.087Z",
    hasGrommet: false, grometX: 0, grometY: 0, grometR: 0,
    symZone: { x: 36.01, y: 53.82, w: 147.66, h: 269.4 },
  },
  "Dog Tag Palm Stone": {
    W: 231.31, H: 346.96,
    clipPath: "M64.630 3.402L166.677 3.402C200.493 3.402 227.905 30.814 227.905 64.630L227.905 282.329C227.905 316.145 200.493 343.558 166.677 343.558L64.630 343.558C30.814 343.558 3.402 316.145 3.402 282.329L3.402 64.630C3.402 30.814 30.814 3.402 64.630 3.402Z",
    hasGrommet: false, grometX: 0, grometY: 0, grometR: 0,
    symZone: { x: 24.83, y: 33.65, w: 182.08, h: 279.47 },
  },
};

// Eternal Love symbol path, ported from the sandbox's SYMBOL constant —
// used as the fallback render when a chosen symbol has no SVG path data yet.
export const FALLBACK_SYMBOL = {
  aspectW: 100,
  aspectH: 62.3,
  path: "M37.328 0.073C31.368 0.625 26.003 5.521 25.259 11.507C24.792 15.083 25.908 18.717 27.96 21.64C29.658 24.122 31.852 26.196 33.936 28.345C30.53 26.707 26.913 25.378 23.136 24.984C21.274 24.893 19.397 24.868 17.537 24.931C13.915 25.545 10.334 26.757 7.394 29.016C2.36 32.714 -0.584 39.103 0.097 45.334C0.628 51.216 4.323 56.579 9.429 59.477C15.353 62.946 22.769 63.006 29.148 60.81C35.102 58.81 40.267 55.051 44.839 50.828C46.584 49.255 48.291 47.64 50.004 46.03C55.447 51.177 60.92 56.567 67.877 59.63C71.542 61.353 75.568 62.313 79.629 62.234C80.894 62.194 82.182 62.379 83.418 62.023C88.416 61.186 93.143 58.561 96.228 54.51C99.614 50.241 100.842 44.38 99.414 39.119C98.055 33.597 93.878 28.99 88.691 26.743C83.369 24.306 77.184 24.396 71.651 26.074C69.712 26.641 67.855 27.444 66.066 28.379C69.252 25.106 72.71 21.804 74.167 17.352C75.03 14.891 75.045 12.157 74.378 9.65C72.642 3.826 66.615 -0.466 60.51 0.071C56.824 0.249 53.367 2.276 51.059 5.094C50.569 5.838 49.966 7.163 49.36 5.715C46.718 1.871 41.999 -0.452 37.328 0.073ZM41.506 3.826C45.036 4.994 47.686 8.211 48.367 11.835C48.462 13.415 50.804 13.96 51.446 12.448C51.919 10.976 52.166 9.394 53.083 8.102C55.097 4.879 59.015 2.804 62.834 3.489C67.233 4.143 71.162 7.94 71.455 12.452C71.418 13.295 71.553 14.173 71.388 14.999C70.725 17.316 69.651 19.522 68.066 21.357C63.971 26.224 58.672 29.857 54.228 34.381C52.73 35.841 51.286 37.366 50.086 39.084C49.223 38.513 48.559 37.055 47.637 36.227C42.872 31.017 36.906 27.06 32.237 21.757C30.146 19.261 28.37 16.176 28.552 12.813C28.547 12.128 28.494 11.436 28.807 10.803C29.294 9.064 30.256 7.488 31.606 6.284C34.08 3.74 38.128 2.714 41.506 3.826ZM24.865 28.632C31.71 30.033 37.574 34.217 42.653 38.83C44.347 40.359 45.956 41.978 47.591 43.57C42.579 48.543 37.356 53.552 30.851 56.517C28.392 57.643 25.767 58.415 23.106 58.861C20.131 58.849 17.068 59.076 14.235 57.977C8.571 56.169 3.968 51.008 3.426 45.009C2.834 39.488 5.761 33.896 10.439 30.976C13.008 29.358 16.014 28.426 19.037 28.225C20.983 28.233 22.944 28.31 24.865 28.632ZM83.512 28.556C88.989 29.641 94.062 33.46 95.862 38.85C97.565 43.794 96.401 49.641 92.755 53.438C89.068 57.676 83.162 59.351 77.693 58.843C70.913 58.268 64.845 54.623 59.704 50.385C57.131 48.278 54.755 45.948 52.436 43.57C57.711 38.156 63.482 32.895 70.589 30.026C73.64 28.807 76.917 28.048 80.22 28.257C81.32 28.296 82.427 28.345 83.512 28.556Z",
};

// Most symbols in "RMG Symbol Library" are authored as filled compound
// shapes (an outer contour plus subtractive inner-hole contours, rendered
// with fill-rule evenodd — see Eternal Love). A few, like Infinity Symbol,
// are authored as a single open centerline curve instead and need to be
// stroked rather than filled. Value is the stroke width in viewBox units,
// hand-matched to the ~3.3-3.4 unit line thickness measured on Eternal
// Love's compound geometry so both read as the same weight. Anthony's call
// 2026-07-06: hardcode exceptions here rather than add a Notion field, since
// this codebase is maintained the same way the Notion data is.
export const STROKE_STYLE_SYMBOLS: Record<string, number> = {
  "Infinity Symbol": 3.4,
};

export const INLAY_SWATCH: Record<string, { hex: string; metallic: boolean; grommetMetal: "gold" | "silver" }> = {
  Natural: { hex: "#C9BBA3", metallic: false, grommetMetal: "gold" },
  Gold: { hex: "#D4AF37", metallic: true, grommetMetal: "gold" },
  Silver: { hex: "#B8BEC4", metallic: true, grommetMetal: "silver" },
  White: { hex: "#E8E6E0", metallic: true, grommetMetal: "silver" },
  Turquoise: { hex: "#5FB3B3", metallic: false, grommetMetal: "silver" },
};

// Dev-only flat swatch per stone, standing in for the real polished photo —
// matches the "placeholders for now" decision. Falls back to a Color Family
// hue for any real Notion stone not in this list.
export const STONE_SWATCH: Record<string, string> = {
  "Black Jade": "#2b2b2b",
  "Black Obsidian": "#1c1c1c",
  "Purple Jade": "#7d6b96",
  Labradorite: "#4b5563",
  "Golden Tiger's Eye": "#b8863b",
  "Red Tiger's Eye": "#9c4a3a",
  "Beige/Peach Moonstone": "#d9c3a9",
  "Picture Jasper": "#a9834f",
  "Morado Opal": "#b79dc9",
  "Pure Blue Tiger's Eye": "#3a5f7d",
};

export const COLOR_FAMILY_FALLBACK: Record<string, string> = {
  Blue: "#5b7c9d",
  Green: "#5b7d5f",
  Purple: "#7d6b96",
  "Red & Warm": "#9c4a3a",
  Black: "#2b2b2b",
  "Gold & Brown": "#a9834f",
  Neutral: "#c9bba3",
  Multicolor: "#8d8380",
};

// Shared Color Family display order — confirmed with Anthony 2026-07-05 for
// Available Gemstones, reused verbatim on the Studio's Stone screen for
// parity between the two ("same color filter as the marketing page").
export const COLOR_FAMILY_ORDER = ["Neutral", "Gold & Brown", "Red & Warm", "Blue", "Green", "Purple", "Black", "Multicolor"];

export function stoneSwatchColor(name: string, colorFamily: string | null): string {
  return STONE_SWATCH[name] ?? COLOR_FAMILY_FALLBACK[colorFamily ?? ""] ?? "#8d8380";
}
