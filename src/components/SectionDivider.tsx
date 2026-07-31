import { HeartInfinityIcon } from "./HeartInfinityIcon";

// The gold→blue hairline that separates a heading from what follows, now with
// the Eternal Love mark set into the middle of it (punch list #18). Replaces
// the removed page watermark: the mark earns its place at a seam the eye
// already rests on, instead of floating in a corner competing with content.
//
// The two segments fade outward from the mark so the line reads as one rule
// interrupted by the glyph, not two stray dashes either side of it.
export function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className}`} aria-hidden>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" />
      <HeartInfinityIcon className="h-3 w-5 shrink-0 opacity-70" color="#c6a164" />
      <span className="h-px w-10 bg-gradient-to-r from-blue to-transparent" />
    </div>
  );
}
