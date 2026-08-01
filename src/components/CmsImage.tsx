import Image from "next/image";

// Renders a Notion-hosted image when one exists; otherwise a placeholder
// block matching Anthony's mockup convention (gray/beige tint, no broken
// image icons). Swapping to a real photo later needs no code change —
// just uploading the file onto the corresponding Notion row.
export function CmsImage({
  src,
  alt,
  label,
  className = "",
  aspect = "aspect-square",
  // "cover" (default) crops the photo to fill the box exactly — right for
  // grids where every tile needs to be the same size. "contain" shows the
  // whole photo with empty space around it instead of cropping — for a
  // single curated shot where trimming could cut out part of the
  // composition (e.g. the homepage hero flatlay, 2026-07-31).
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
  aspect?: string;
  fit?: "cover" | "contain";
}) {
  if (src) {
    return (
      // overflow-hidden is what actually makes `className`'s rounded-*
      // classes visible — without it the square photo just hangs off the
      // edges of its own rounded box. Missing this was a real bug (found
      // 2026-07-31): every image on the site had square corners regardless
      // of the rounded-* class passed in.
      <div className={`relative overflow-hidden ${aspect} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
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
