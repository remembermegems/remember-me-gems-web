import type { WebsitePage } from "@/lib/notion/types";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { CmsImage } from "@/components/CmsImage";
import { sectionAlt } from "@/lib/altText";
import { PullQuote } from "@/components/PullQuote";
import { SectionDivider } from "@/components/SectionDivider";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";

// Sections whose photo treatment deviates from the page's default (image
// leads directly under the header, before the body). Notion's own Image
// Notes field is still empty for these rows, so the placeholder slot is
// forced on here rather than inferred — fill in the real shot notes in
// Notion when convenient, but don't wait on that to show the layout.
const IMAGE_OVERRIDES: Record<string, { position: "above-headline" | "below-headline"; label: string }> = {
  "The Shape of Focus": {
    position: "above-headline",
    label: "Side-profile view of the biconvex lens shape",
  },
};

// Narrow, single-column essay layout — one continuous flow, no alternating
// bands or side-by-side grids. Built for "Why a Remember Me Gem": the intro
// line reads like a quiet pull quote (set apart typographically, not in a
// tinted panel — that treatment is reserved for the page's real Pull Quote
// fields), and any section with its own image leads with that photo directly
// under its header, before the body text.
export async function EssayPage({ page }: { page: WebsitePage }) {
  const sections = await getWebsiteCopy(page);
  if (sections.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center text-cocoa/50 font-body">
        No copy yet for &ldquo;{page}&rdquo; in the RMG Website Copy database.
      </div>
    );
  }

  const [hero, ...rest] = sections;
  const closing = rest[rest.length - 1]?.ctaLabel ? rest[rest.length - 1] : null;
  const body = closing ? rest.slice(0, -1) : rest;

  return (
    <div className="max-w-[640px] mx-auto px-6 py-20">
      <h1 className="font-heading text-4xl text-center text-cocoa mb-6" style={{ color: "#4E3F35" }}>
        {hero.headline}
      </h1>
      <SectionDivider className="mb-10" />

      {/* This page is designed to always open with a hero image (unlike
          Our Promise/Care/Contact, which are deliberately hero-image-free) —
          show the placeholder slot regardless of whether Notion's Image Notes
          field has been filled in yet, rather than inferring it from that. */}
      <CmsImage src={hero.imageUrl} alt={sectionAlt(hero)} label={hero.imageNotes || "Hero image"} aspect="aspect-[4/3]" className="rounded-2xl mb-10" />

      {hero.body && (
        <p className="font-heading italic text-2xl text-cocoa/90 text-center mb-16 leading-relaxed">{hero.body}</p>
      )}

      <div className="space-y-14">
        {body.map((section) => {
          const override = IMAGE_OVERRIDES[section.section];
          const hasImage = Boolean(section.imageUrl) || Boolean(section.imageNotes) || Boolean(override);
          const image = hasImage ? (
            <CmsImage
              src={section.imageUrl}
              alt={sectionAlt(section)}
              label={section.imageNotes || override?.label}
              aspect="aspect-[4/3]"
              className="rounded-2xl mb-6"
            />
          ) : null;

          return (
            <div key={section.id}>
              {override?.position === "above-headline" && image}
              {section.headline && (
                <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
                  {section.headline}
                </h2>
              )}
              {override?.position !== "above-headline" && image}
              {section.body && <p className="font-body text-cocoa/80 whitespace-pre-line">{section.body}</p>}
              {section.pullQuote && <PullQuote>{section.pullQuote}</PullQuote>}
            </div>
          );
        })}
      </div>

      {closing?.ctaLabel && (
        <div className="text-center mt-16">
          <CtaLink href={closing.ctaUrl || DEFAULT_CTA_URL}>{closing.ctaLabel}</CtaLink>
        </div>
      )}
    </div>
  );
}
