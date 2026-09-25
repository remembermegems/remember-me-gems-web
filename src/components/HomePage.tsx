import Image from "next/image";
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
import { VideoEmbed, NotionVideo } from "@/components/VideoEmbed";
import type { WebsiteCopySection } from "@/lib/notion/types";

// Splits the "How It Works" body into its roman-numeral steps (Notion stores
// "I. ...\n\nII. ...\n\nIII. ...\n\nIV. ..." as one field, 4 steps as of the
// 2026-08 homepage redesign, punch list #32) and strips the numeral prefix,
// since the numbering is rendered as its own big "1/2/3/4" marker rather than
// inline text.
function parseSteps(body: string): { title: string; body: string }[] {
  return body
    .split(/\n\n+/)
    .filter((p) => /^\s*[IVX]+\.\s*/i.test(p)) // drops the intro paragraph, which has no numeral prefix
    .map((p) => {
      const [title, ...rest] = p.replace(/^\s*[IVX]+\.\s*/i, "").trim().split("\n");
      return { title: title.trim(), body: rest.join(" ").trim() };
    });
}

// Parses the Up Close section's "Label: value" lines (Front/Back/Stone/Inlay)
// out of its Body field into an ordered lookup, same spirit as parseSteps.
function parseLabeledLines(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of body.split("\n")) {
    const match = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (match) map.set(match[1].trim().toLowerCase(), match[2].trim());
  }
  return map;
}

// Pipe-separated trust checkmarks under the Home hero CTA (punch list #32),
// same parsing convention as LinksRow's "Links" field.
function parseTrustPoints(value: string): string[] {
  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

function findSection(sections: WebsiteCopySection[], pattern: RegExp) {
  return sections.find((s) => pattern.test(s.section));
}

// Full-bleed hero background photo — fills whatever height the overlaid text
// content sets (via the `relative`/`absolute inset-0` parent pairing), rather
// than a fixed aspect ratio. A fixed-aspect box (CmsImage's usual shape)
// clips or overflows here because hero copy length varies and can't be
// predicted against a locked photo height, especially on narrow phones where
// the text alone can run taller than any reasonable hero aspect ratio.
function HeroBackground({
  src,
  alt,
  label,
  className = "",
}: {
  src: string | null;
  alt: string;
  label: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" priority />
      </div>
    );
  }
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-dusty-sky/30 text-cocoa/40 ${className}`}
      role="img"
      aria-label={alt}
    >
      <span className="font-body text-xs tracking-wide uppercase px-3 text-center">{label}</span>
    </div>
  );
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
  const upClose = findSection(sections, /Up Close/i);
  const howItWorks = findSection(sections, /How It Works/i);
  const whyGems = findSection(sections, /Why Gemstones/i);
  const ourGems = findSection(sections, /Our Gems/i);
  const ourStory = findSection(sections, /Our Story/i);
  const closing = findSection(sections, /Closing/i);

  const steps = howItWorks ? parseSteps(howItWorks.body) : [];
  const trustPoints = hero?.trustPoints ? parseTrustPoints(hero.trustPoints) : [];
  const upCloseLines = upClose ? parseLabeledLines(upClose.body) : new Map<string, string>();
  const [closingBody, closingLine] = closing ? closing.body.split(/\n\n+/) : [];
  // Curated via the "Featured on Homepage" checkbox in Notion; falls back to
  // the first 5 available stones if nothing's been marked yet so the row
  // never renders empty.
  const featuredStones = stones.some((s) => s.featuredOnHomepage)
    ? stones.filter((s) => s.featuredOnHomepage)
    : stones.slice(0, 5);

  return (
    <div>
      {/* Hero — full-bleed photo, edge to edge, with copy overlaid on the left
          behind a scrim card for legibility (punch list #32, 2026-08-25,
          revised same day: Anthony's call — text stays contained, but the
          photo itself spans the full page width, not just a right-hand
          column). Separate mobile/desktop crops via imageMobileUrl, since a
          wide desktop crop doesn't work rotated into a tall mobile one. Only
          a bottom curve — the nav sits directly above with nothing to pair a
          top curve into. */}
      <LensSection tint="cream" lens="bottom" className="relative overflow-hidden">
        <div className="hidden sm:block">
          <HeroBackground
            src={hero?.imageUrl ?? null}
            alt={hero ? sectionAlt(hero) : "Hero"}
            label={hero?.imageNotes || "A gem worn against the chest, or resting in an open hand"}
          />
        </div>
        <div className="block sm:hidden">
          <HeroBackground
            src={hero?.imageMobileUrl ?? hero?.imageUrl ?? null}
            alt={hero ? sectionAlt(hero) : "Hero"}
            label={hero?.imageNotes || "A gem worn against the chest, or resting in an open hand"}
          />
        </div>
        <div className="relative py-16 sm:py-24">
          <div className="max-w-[1100px] w-full mx-auto px-6">
            <div className="max-w-md bg-cream/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-sm">
              {hero?.label && (
                <p className="font-body text-xs sm:text-sm font-medium uppercase tracking-wide text-gold mb-4">
                  {hero.label}
                </p>
              )}
              {hero?.headline && (
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-cocoa mb-6" style={{ color: "#4E3F35" }}>
                  {hero.headline}
                </h1>
              )}
              <SectionDivider className="mb-6" />
              {hero?.body && <p className="font-body text-base sm:text-lg text-cocoa/80 mb-8 whitespace-pre-line">{hero.body}</p>}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <CtaLink href={hero?.ctaUrl || DEFAULT_CTA_URL}>{hero?.ctaLabel || "Create Yours →"}</CtaLink>
                {hero?.links && <LinksRow links={hero.links} />}
              </div>
              {trustPoints.length > 0 && (
                <ul className="grid gap-y-2 text-left">
                  {trustPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 font-body text-sm text-cocoa/80">
                      <span className="text-gold" aria-hidden>✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </LensSection>

      {/* Up Close — warm-white, flat, receives Hero's bottom curve. New
          section (punch list #32): pairs a "hear the story" video with a
          front/back card of Anthony's own gem. Real video/photos not shot
          yet — CmsImage/VideoPlaceholder below render the standard gray
          placeholder box until Anthony uploads them onto this Notion row. */}
      {upClose && (
        <section className="bg-warm-white pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-[880px] mx-auto px-6 text-center">
            {upClose.headline && (
              <h2 className="font-heading text-3xl uppercase tracking-wide text-cocoa mb-4" style={{ color: "#4E3F35" }}>
                {upClose.headline}
              </h2>
            )}
            {upClose.pullQuote && <p className="font-body text-cocoa/80 mb-10 max-w-lg mx-auto">{upClose.pullQuote}</p>}
            <div className="grid sm:grid-cols-2 gap-6 text-left items-stretch">
              <div>
                {upClose.videoFileUrl ? (
                  <NotionVideo src={upClose.videoFileUrl} />
                ) : upClose.videoUrl ? (
                  <VideoEmbed url={upClose.videoUrl} title="Hear the story behind my gem" />
                ) : upClose.storyText ? (
                  <div className="h-full rounded-2xl border border-cocoa/10 p-6 flex flex-col justify-center gap-4 font-body text-cocoa/80 leading-relaxed">
                    {upClose.storyText
                      .split(/\n{1,}/)
                      .map((para) => para.trim())
                      .filter(Boolean)
                      .map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                  </div>
                ) : (
                  <div
                    className="aspect-video rounded-2xl bg-dusty-sky/30 text-cocoa/40 flex items-center justify-center"
                    role="img"
                    aria-label="Hear the story behind my gem — video coming soon"
                  >
                    <span className="font-body text-xs tracking-wide uppercase px-3 text-center">
                      ▶ Hear the story behind my gem
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-cream rounded-2xl p-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <CmsImage
                    src={upClose.imageUrl}
                    alt={upClose.altText || "Front of the gem — photo coming soon"}
                    label="Photo coming soon"
                    aspect="aspect-square"
                    className="rounded-xl mb-2"
                  />
                  <p className="font-body text-[10px] uppercase tracking-wide text-cocoa/50">Front</p>
                  <p className="font-body text-sm text-cocoa">{upCloseLines.get("front")}</p>
                </div>
                <div className="text-center">
                  <CmsImage
                    src={upClose.image2Url}
                    alt={upClose.image2AltText || "Back of the gem — photo coming soon"}
                    label="Photo coming soon"
                    aspect="aspect-square"
                    className="rounded-xl mb-2"
                  />
                  <p className="font-body text-[10px] uppercase tracking-wide text-cocoa/50">Back</p>
                  <p className="font-body text-sm text-cocoa">{upCloseLines.get("back")}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-cocoa/10 text-sm text-cocoa/80 space-y-1">
                  {upCloseLines.get("stone") && <p><span className="font-medium text-cocoa">Stone:</span> {upCloseLines.get("stone")}</p>}
                  {upCloseLines.get("inlay") && <p><span className="font-medium text-cocoa">Inlay:</span> {upCloseLines.get("inlay")}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works — cream, lens (moved up to directly follow Up Close;
          Our Story now sits after this instead of near the page's end) */}
      <LensSection tint="cream" className="py-16">
        <div className="max-w-[960px] mx-auto px-6">
          <h2 className="font-heading text-3xl text-center uppercase tracking-wide text-cocoa mb-10" style={{ color: "#4E3F35" }}>
            {howItWorks?.label || "How It Works"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center mb-10">
            {steps.map((step, i) => (
              <div key={i}>
                <p className="font-heading text-3xl text-gold mb-3">{i + 1}</p>
                <p className="font-body font-medium text-cocoa mb-1">{step.title}</p>
                <p className="font-body text-cocoa/80">{step.body}</p>
              </div>
            ))}
          </div>
          {howItWorks?.links && <div className="text-center"><LinksRow links={howItWorks.links} /></div>}
        </div>
      </LensSection>

      {/* Our Story — warm-white, flat, receives How It Works' bottom curve.
          Moved up from its old spot near the end of the page (punch list
          #32) to directly follow How It Works. */}
      {ourStory && (
        <section className="bg-warm-white pt-16 sm:pt-24 pb-16 sm:pb-24">
          <div className="max-w-[640px] mx-auto px-6 text-center">
            <h2 className="font-heading text-3xl uppercase tracking-wide text-cocoa mb-8" style={{ color: "#4E3F35" }}>
              {ourStory.label}
            </h2>
            {/* Natural-shape rendering (same fix as the hero, 2026-08-01) —
                Anthony's call: this is a specific sentimental photo (his
                mother's urn and the first Remember Me Gem) and it must show
                in full, uncropped, regardless of the box shape used
                elsewhere. width/height are only a layout-reservation guess
                before the real photo loads; w-full h-auto lets its actual
                shape win once it's in. */}
            {ourStory.imageUrl ? (
              <Image
                src={ourStory.imageUrl}
                alt={sectionAlt(ourStory)}
                width={1200}
                height={1500}
                sizes="(max-width: 768px) 100vw, 640px"
                className="w-full h-auto rounded-2xl mb-8"
              />
            ) : (
              <CmsImage
                src={null}
                alt="Our Story"
                label={ourStory.imageNotes || "Candid family photo, or Dad with his gem"}
                aspect="aspect-[4/3]"
                className="rounded-2xl mb-8"
              />
            )}
            {ourStory.body && <p className="font-body text-cocoa/80 whitespace-pre-line mb-6">{ourStory.body}</p>}
            {ourStory.links && <LinksRow links={ourStory.links} />}
          </div>
        </section>
      )}

      {/* Why Gemstones — cream, lens (this slot keeps the old alternation
          going now that Our Story moved up ahead of it) */}
      {whyGems && (
        <LensSection tint="cream" className="py-16">
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
        </LensSection>
      )}

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

      {/* Closing CTA — bulges its own top curve up into Our Gems above, since
          it's now the final section without a lens section below it to rely
          on for that seam. Same warm-white fill as before, just reframed as
          a LensSection so the alternating curve pattern still holds with the
          page's new section count. */}
      {closing && (
        <LensSection tint="white" lens="top" className="pt-16 sm:pt-24 pb-20">
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
        </LensSection>
      )}
    </div>
  );
}
