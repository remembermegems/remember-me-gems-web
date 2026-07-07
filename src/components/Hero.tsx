import { CtaLink } from "./CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";
import { WatermarkSection } from "./Watermark";

export function Hero({
  eyebrow,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  lens = false,
}: {
  eyebrow?: string;
  headline: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
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
      <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-gold to-blue" />
      {body && <p className="font-body text-base text-cocoa/80 mb-8">{body}</p>}
      {ctaLabel && <CtaLink href={ctaUrl || DEFAULT_CTA_URL}>{ctaLabel}</CtaLink>}
    </div>
  );

  if (lens) {
    return (
      <WatermarkSection side="left" tint="white" watermark={false} lens="bottom" className="py-12 sm:py-16 px-6 text-center">
        {content}
      </WatermarkSection>
    );
  }

  return <section className="bg-warm-white py-12 sm:py-16 px-6 text-center">{content}</section>;
}
