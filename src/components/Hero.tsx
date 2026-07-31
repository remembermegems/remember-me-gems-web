import { CtaLink } from "./CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";
import { LensSection } from "./LensSection";
import { SectionDivider } from "./SectionDivider";
import { VideoEmbed, NotionVideo } from "./VideoEmbed";

export function Hero({
  eyebrow,
  headline,
  body,
  pullQuote,
  ctaLabel,
  ctaUrl,
  videoUrl,
  videoFileUrl,
  lens = false,
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  // Opt-in per page via the Notion "Pull Quote" field — currently used only by
  // the Studio intro, to state the starting price up front. Pages that leave
  // the field empty are unaffected.
  pullQuote?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  // Opt-in per page via the Notion "Video URL" / "Video" fields, same
  // pattern as Pull Quote above. Wired here because every page renders a
  // Hero, so this one point makes video available site-wide without editing
  // each bespoke page component (punch list #21).
  videoUrl?: string;
  videoFileUrl?: string | null;
  // Opt-in only — this component is shared across 8 pages, and the convex
  // lens curve was only requested for the 3 catalog listing pages
  // (Available Gemstones, Symbols, Shapes), not Contact/Care/Our Promise/etc.
  lens?: boolean;
}) {
  const content = (
    <div className="max-w-[720px] mx-auto">
      {eyebrow && (
        <p className="font-body text-base sm:text-lg font-medium uppercase tracking-wide text-gold mb-4">{eyebrow}</p>
      )}
      <h1 className="font-heading text-3xl sm:text-4xl text-cocoa mb-6" style={{ color: "#4E3F35" }}>
        {headline}
      </h1>
      <SectionDivider className="mb-6" />
      {body && <p className="font-body text-base text-cocoa/80 mb-8">{body}</p>}
      {pullQuote && <p className="font-heading text-xl text-cocoa mb-8">{pullQuote}</p>}
      {(videoFileUrl || videoUrl) && (
        <div className="mb-8">
          {/* An uploaded file wins over a platform URL — it's the more robust
              of the two, so providing both reads as meaning the upload. */}
          {videoFileUrl ? <NotionVideo src={videoFileUrl} /> : <VideoEmbed url={videoUrl ?? null} title={headline} />}
        </div>
      )}
      {ctaLabel && <CtaLink href={ctaUrl || DEFAULT_CTA_URL}>{ctaLabel}</CtaLink>}
    </div>
  );

  if (lens) {
    return (
      <LensSection tint="white" lens="bottom" className="py-12 sm:py-16 px-6 text-center">
        {content}
      </LensSection>
    );
  }

  return <section className="bg-warm-white py-12 sm:py-16 px-6 text-center">{content}</section>;
}
