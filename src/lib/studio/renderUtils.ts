// Ported near-verbatim from the render sandbox (Configurator deploys/rmg_sandbox_v1.html).

export function lighten(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function darken(hex: string, amt: number): string {
  return lighten(hex, -amt);
}

// Approximates a CSS "radial-gradient(ellipse at X% Y%, ...)" using a circular
// gradient plus a non-uniform scale, so it stretches to match the shape's box.
export function ellipseGradientFill(
  ctx: CanvasRenderingContext2D,
  cxFrac: number,
  cyFrac: number,
  rFrac: number,
  W: number,
  H: number,
  stops: [number, string][],
  composite?: GlobalCompositeOperation
) {
  ctx.save();
  if (composite) ctx.globalCompositeOperation = composite;
  const M = Math.max(W, H);
  const cx = W * cxFrac;
  const cy = H * cyFrac;
  const R = M * rFrac;
  ctx.translate(cx, cy);
  ctx.scale(W / M, H / M);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  stops.forEach(([off, col]) => grad.addColorStop(off, col));
  ctx.fillStyle = grad;
  ctx.fillRect(-M, -M, M * 2, M * 2);
  ctx.restore();
}
