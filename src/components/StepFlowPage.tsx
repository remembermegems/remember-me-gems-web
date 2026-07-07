import type { WebsitePage } from "@/lib/notion/types";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { StepFlow } from "@/components/StepFlow";
import { PullQuote } from "@/components/PullQuote";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";
import { WatermarkSection } from "@/components/Watermark";

// Shared page shell for How It Works and How We Make Your Gem — both use the
// same connected-thread step pattern, differing only in how much closing
// content follows the steps (see project-rmg-website-cms memory). Only How
// It Works gets the beige+watermark treatment — pass watermark explicitly
// per page rather than defaulting it on, since How We Make Your Gem isn't
// one of the three pages that treatment is locked to.
export async function StepFlowPage({ page, watermark = false }: { page: WebsitePage; watermark?: boolean }) {
  const sections = await getWebsiteCopy(page);
  if (sections.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center text-cocoa/50 font-body">
        No copy yet for &ldquo;{page}&rdquo; in the RMG Website Copy database.
      </div>
    );
  }

  const [hero, ...rest] = sections;
  const steps = rest.filter((s) => /^Step\s+\S+\s+—/i.test(s.section));
  const tail = rest.filter((s) => !steps.includes(s));

  const stepsBlock = <StepFlow steps={steps} />;
  const tailBlock = (
    <div className="max-w-[680px] mx-auto px-6 pt-16 sm:pt-24 pb-20">
      {tail.map((section) => (
        <div key={section.id}>
          {section.headline && (
            <h2 className="font-heading text-2xl text-center text-cocoa mb-2" style={{ color: "#4E3F35" }}>
              {section.headline}
            </h2>
          )}
          {section.body && <PullQuote>{section.body}</PullQuote>}
          {section.ctaLabel && (
            <div className="text-center mt-6">
              <CtaLink href={section.ctaUrl || DEFAULT_CTA_URL}>{section.ctaLabel}</CtaLink>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <Hero eyebrow={hero.label} headline={hero.headline} body={hero.body} />
      {watermark ? (
        <>
          <WatermarkSection side="left" tint="cream" lens className="py-4">
            {stepsBlock}
          </WatermarkSection>
          <WatermarkSection side="right" tint="white" lens={false} className="py-4">
            {tailBlock}
          </WatermarkSection>
        </>
      ) : (
        <>
          {stepsBlock}
          {tailBlock}
        </>
      )}
    </div>
  );
}
