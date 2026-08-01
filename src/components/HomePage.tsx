import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { getStones } from "@/lib/notion/stones";
import { CmsImage } from "@/components/CmsImage";
import { sectionAlt, stoneAlt } from "@/lib/altText";
import { PullQuote } from "@/components/PullQuote";
import { LinksRow } from "@/components/LinksRow";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";
import { LensSection } from "@/components/LensSection";
import { SectionDivider } from "@/components/SectionDivider";
import type { WebsiteCopySection } from "@/lib/notion/types";

// Splits the "How It Works" body into its three roman-numeral steps
// (Notion stores "I. ...\n\nII. ...\n\nIII. ..." as one field) and strips
// the numeral prefix, since the numbering is rendered as its own big "1/2/3"
// marker rather than inline text.
function parseSteps(body: string): string[] {
  return body
    .split(/\n\n+/)
    .map((p) => p.replace(/^\s*[IVX]+\.\s*/i, "").trim())
    .filter(Boolean);
}

function findSection(sections: WebsiteCopySection[], pattern: RegExp) {
  return sections.find((s) => pattern.test(s.section));
}

// Bespoke Home page — the approved mockup (Design Assets/Approved Mockups/
// home page 1-5.png) gives every section its own specific treatment that the
// generic page template can't reproduce: alternating cream/white bands
// (these carried a faint heart-infinity watermark until it was removed on
// 2026-07-28, punch list #6), a centered single-column layout for Why
// Gemstones and Our Story (image above text, per the mockup's own
// annotation), a real 5-stone swatch row, and a distinct closing line on the
// final section.
export async function HomePage() {
  const [sections, stones] = await Promise.all([getWebsiteCopy("Home"), getStones()]);

  const hero = findSection(sections, /^Hero$/i);
  const howItWorks = findSection(sections, /How It Works/i);
  const whyGems = findSection(sections, /Why Gemstones/i);
  const ourGems = findSection(sections, /Our Gems/i);
  const ourStory = findSection(sections, /Our Story/i);
  const closing = findSection(sections, /Closing/i);

  const steps = howItWorks ? parseSteps(howItWorks.body) : [];
  const [closingBody, closingLine] = closing ? closing.body.split(/\n\n+/) : [];
  // Curated via the "Featured on Homepage" checkbox in Notion; falls back to
  // the first 5 available stones if nothing's been marked yet so the row
  // never renders empty.
  const featuredStones = stones.some((s) => s.featuredOnHomepage)
    ? stones.filter((s) => s.featuredOnHomepage)
    : stones.slice(0, 5);

  return (
    <div>
      {/* Hero — cream, only a bottom curve (into Why Gemstones below); the nav
          sits directly above with nothing to pair a top curve into */}
      <LensSection tint="cream" lens="bottom" className="py-20 sm:py-24">
        <div className="max-w-[720px] mx-auto px-6 text-center">
          {hero?.headline && (
            <h1 className="font-heading text-3xl sm:text-4xl text-cocoa mb-6" style={{ color: "#4E3F35" }}>
              {hero.headline}
            </h1>
          )}
          <SectionDivider className="mb-8" />
          {/* fit="contain" (Anthony's call, 2026-07-31): this is a single
              curated flatlay, not a grid tile — cropping to fill the 16:10
              box was cutting pieces out of the composition. Shows the whole
              photo instead, letterboxed on the surrounding cream background. */}
          <CmsImage
            src={hero?.imageUrl ?? null}
            alt={hero ? sectionAlt(hero) : "Hero"}
            label={hero?.imageNotes || "A gem worn against the chest, or resting in an open hand"}
            aspect="aspect-[16/10]"
            className="rounded-3xl mb-10"
            fit="contain"
          />
          {hero?.body && <p className="font-body text-lg text-cocoa/80 mb-8 whitespace-pre-line">{hero.body}</p>}
          {hero?.links && <div className="mb-8"><LinksRow links={hero.links} /></div>}
          <CtaLink href={hero?.ctaUrl || DEFAULT_CTA_URL}>{hero?.ctaLabel || "Create Yours →"}</CtaLink>
        </div>
      </LensSection>

      {/* Why Gemstones — warm-white, flat, receives curves from both neighbors
          (this slot keeps How It Works' old background/lens treatment; only
          the copy moved) */}
      {whyGems && (
        <section className="bg-warm-white pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl uppercase tracking-wide text-cocoa mb-8" style={{ color: "#4E3F35" }}>
              {whyGems.label}
            </h2>
            {whyGems.pullQuote && <PullQuote>{whyGems.pullQuote}</PullQuote>}
            <CmsImage
              src={whyGems.imageUrl}
              alt={sectionAlt(whyGems)}
              label={whyGems.imageNotes || "Macro of a biconvex gem catching light"}
              aspect="aspect-[4/3]"
              className="rounded-2xl mb-8"
            />
            {whyGems.body && <p className="font-body text-cocoa/80 whitespace-pre-line mb-6">{whyGems.body}</p>}
            {whyGems.links && <LinksRow links={whyGems.links} />}
          </div>
        </section>
      )}

      {/* How It Works — cream, lens (this slot keeps
          Why Gemstones' old background/lens treatment; only the copy moved) */}
      <LensSection tint="cream" className="py-16">
        <div className="max-w-[960px] mx-auto px-6">
          <h2 className="font-heading text-3xl text-center uppercase tracking-wide text-cocoa mb-10" style={{ color: "#4E3F35" }}>
            {howItWorks?.label || "How It Works"}
          </h2>
          <div className="grid sm:grid-cols-3 gap-10 text-center mb-10">
            {steps.map((step, i) => (
              <div key={i}>
                <p className="font-heading text-3xl text-gold mb-3">{i + 1}</p>
                <p className="font-body text-cocoa/80">{step}</p>
              </div>
            ))}
          </div>
          {howItWorks?.links && <div className="text-center"><LinksRow links={howItWorks.links} /></div>}
        </div>
      </LensSection>

      {/* Our Gemstones — warm-white, flat, real 5-stone swatch row */}
      {ourGems && (
        <section className="bg-warm-white pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-[880px] mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl uppercase tracking-wide text-cocoa mb-6" style={{ color: "#4E3F35" }}>
              {ourGems.label}
            </h2>
            {ourGems.body && <p className="font-body text-cocoa/80 mb-10">{ourGems.body}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mb-10">
              {featuredStones.map((stone) => (
                <div key={stone.id}>
                  {/* Matches the same fix already applied on the Stone screen
                      and Available Gemstones: "Polished Photo" is reserved for
                      a future photoshoot and is empty on every stone today,
                      while "Stone Image" is what Anthony actually uploads to. */}
                  <CmsImage
                    src={stone.stoneImageUrl}
                    alt={stoneAlt(stone)}
                    label={stone.name}
                    aspect="aspect-square"
                    className="rounded-2xl"
                  />
                  <p className="font-body text-sm text-cocoa/70 mt-2">{stone.name}</p>
                </div>
              ))}
            </div>
            {ourGems.links && <LinksRow links={ourGems.links} />}
          </div>
        </section>
      )}

      {/* Our Story — cream, lens, centered single column */}
      {ourStory && (
        <LensSection tint="cream" className="py-16">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl uppercase tracking-wide text-cocoa mb-8" style={{ color: "#4E3F35" }}>
              {ourStory.label}
            </h2>
            <CmsImage
              src={ourStory.imageUrl}
              alt={sectionAlt(ourStory)}
              label={ourStory.imageNotes || "Candid family photo, or Dad with his gem"}
              aspect="aspect-[4/3]"
              className="rounded-2xl mb-8"
            />
            {ourStory.body && <p className="font-body text-cocoa/80 whitespace-pre-line mb-6">{ourStory.body}</p>}
            {ourStory.links && <LinksRow links={ourStory.links} />}
          </div>
        </LensSection>
      )}

      {/* Closing CTA — warm-white, flat */}
      {closing && (
        <section className="bg-warm-white pt-16 sm:pt-24 pb-20">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl text-cocoa mb-8" style={{ color: "#4E3F35" }}>
              {closing.label}
            </h2>
            {closing.pullQuote && <PullQuote>{closing.pullQuote}</PullQuote>}
            {closingBody && <p className="font-body text-cocoa/80 mb-4">{closingBody}</p>}
            {closingLine && (
              <p className="font-heading text-lg uppercase tracking-wide text-cocoa mb-8" style={{ color: "#4E3F35" }}>
                {closingLine}
              </p>
            )}
            <CtaLink href={closing.ctaUrl || DEFAULT_CTA_URL}>{closing.ctaLabel || "Create Yours →"}</CtaLink>
          </div>
        </section>
      )}
    </div>
  );
}
