import Image from "next/image";

// Renders a Notion-hosted image when one exists; otherwise a placeholder
// block matching Anthony's mockup convention (gray/beige tint, no broken
// image icons). Swapping to a real photo later needs no code change —
// just uploading the file onto the corresponding Notion row.
// Always crops to fill its box (object-cover) — right for grids where every
// tile needs to be the same size. There is deliberately no "show the whole
// photo, no cropping" option here: that needs the photo sized to its own real
// proportions instead of stuffed into a fixed box, which is a different
// rendering approach, not a variant of this one (see the homepage hero in
// HomePage.tsx, which bypasses this component for exactly that reason,
// 2026-08-01 — an earlier attempt at a "contain" mode here looked correct in
// code but never actually rendered rounded, because with the `fill`
// positioning technique used below, the photo element and the box around it
// are always exactly the same size — rounding either one rounds the same
// invisible box, not the visible photo, whenever the photo doesn't fill it).
export function CmsImage({
  src,
  alt,
  label,
  className = "",
  aspect = "aspect-square",
}: {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
  aspect?: string;
}) {
  if (src) {
    return (
      // overflow-hidden is what actually makes `className`'s rounded-*
      // classes visible — without it the square photo just hangs off the
      // edges of its own rounded box. Missing this was a real bug (found
      // 2026-07-31): every image on the site had square corners regardless
      // of the rounded-* class passed in. This works because object-cover
      // guarantees the photo touches all four edges of the box, so rounding
      // the box always rounds a real, visible edge.
      <div className={`relative overflow-hidden ${aspect} ${className}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${aspect} ${className} flex items-center justify-center rounded-2xl bg-dusty-sky/30 text-cocoa/40`}
      role="img"
      aria-label={alt}
    >
      <span className="font-body text-xs tracking-wide uppercase px-3 text-center">
        {label ?? alt}
      </span>
    </div>
  );
}
