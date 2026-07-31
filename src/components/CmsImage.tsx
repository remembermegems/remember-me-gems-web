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
}: {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
  aspect?: string;
}) {
  if (src) {
    return (
      <div className={`relative ${aspect} ${className}`}>
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
