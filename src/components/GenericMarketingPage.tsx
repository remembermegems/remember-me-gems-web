import type { WebsitePage } from "@/lib/notion/types";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { PageSection } from "@/components/PageSection";
import { WatermarkSection } from "@/components/Watermark";

// Shared renderer for the site's simpler pages: first section becomes the
// hero, the rest flow as alternating sections. Pages with real structural
// differences (catalogs, FAQ accordion, Studio embed) have their own components.
export async function GenericMarketingPage({
  page,
  watermark = false,
  hero = true,
}: {
  page: WebsitePage;
  watermark?: boolean;
  hero?: boolean;
}) {
  const sections = await getWebsiteCopy(page);
  if (sections.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center text-cocoa/50 font-body">
        No copy yet for &ldquo;{page}&rdquo; in the RMG Website Copy database.
      </div>
    );
  }

  const [first, ...rest] = sections;
  const heroSection = hero ? first : null;
  const bodySections = hero ? rest : sections;

  return (
    <div>
      {heroSection && (
        <Hero
          headline={heroSection.headline}
          body={heroSection.body}
          ctaLabel={heroSection.ctaLabel}
          ctaUrl={heroSection.ctaUrl}
        />
      )}
      {bodySections.map((section, i) =>
        watermark ? (
          <WatermarkSection
            key={section.id}
            side={i % 2 === 0 ? "left" : "right"}
            tint={i % 2 === 0 ? "cream" : "white"}
            lens={i % 2 === 0}
          >
            <PageSection section={section} imageSide={i % 2 === 0 ? "right" : "left"} />
          </WatermarkSection>
        ) : (
          <PageSection key={section.id} section={section} imageSide={i % 2 === 0 ? "right" : "left"} />
        )
      )}
    </div>
  );
}
