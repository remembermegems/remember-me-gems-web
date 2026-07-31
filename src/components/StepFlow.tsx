import type { WebsiteCopySection } from "@/lib/notion/types";
import { CmsImage } from "./CmsImage";
import { sectionAlt } from "@/lib/altText";

// One continuous flowing section with a thin gold-to-blue thread connecting
// numbered step markers — the shared layout for How It Works and How We Make
// Your Gem. Steps alternate image-left/text-right and the mirror image
// (right-aligned text on the flipped side); steps without a photo yet render
// as simple centered text.
function stepLabel(section: WebsiteCopySection): string {
  const match = section.section.match(/^Step\s+\S+\s+—\s+(.+)$/i);
  return match ? match[1] : section.section;
}

export function StepFlow({ steps }: { steps: WebsiteCopySection[] }) {
  return (
    <div className="relative max-w-[800px] mx-auto px-6 py-8">
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold to-blue opacity-40"
        aria-hidden
      />
      <div className="space-y-16">
        {steps.map((step, i) => {
          const hasImage = Boolean(step.imageUrl) || Boolean(step.imageNotes);
          const mirrored = i % 2 === 1;
          const label = stepLabel(step);

          return (
            <div key={step.id} className="relative pt-16">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold to-blue text-warm-white flex items-center justify-center font-heading text-lg z-10 shadow-sm">
                {i + 1}
              </div>

              {hasImage ? (
                <div className="grid sm:grid-cols-2 gap-8 items-center">
                  <div className={mirrored ? "sm:order-2" : ""}>
                    <CmsImage src={step.imageUrl} alt={sectionAlt(step)} label={step.imageNotes} aspect="aspect-[4/3]" className="rounded-2xl" />
                  </div>
                  <div className={mirrored ? "sm:order-1 sm:text-right" : ""}>
                    <h3 className="font-heading text-2xl text-cocoa mb-3" style={{ color: "#4E3F35" }}>
                      {label}
                    </h3>
                    <p className="font-body text-cocoa/80 whitespace-pre-line">{step.body}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[520px] mx-auto text-center">
                  <h3 className="font-heading text-2xl text-cocoa mb-3" style={{ color: "#4E3F35" }}>
                    {label}
                  </h3>
                  <p className="font-body text-cocoa/80 whitespace-pre-line">{step.body}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
