import type { WebsiteCopySection } from "@/lib/notion/types";
import { CmsImage } from "./CmsImage";
import { PullQuote } from "./PullQuote";
import { CtaLink } from "./CtaButton";
import { VideoEmbed, NotionVideo } from "./VideoEmbed";
import { sectionAlt } from "@/lib/altText";
import { DEFAULT_CTA_URL } from "@/lib/constants";

// Generic renderer for the site's simpler, single-column pages (How It Works,
// Why a Remember Me Gem, Our Promise, Care, Contact, etc). Pages with real
// structural differences (catalog rows, FAQ accordion, Our Story's keepsake
// photo treatment) use their own bespoke components instead of this.
export function PageSection({ section, imageSide = "right" }: { section: WebsiteCopySection; imageSide?: "left" | "right" }) {
  const hasImage = Boolean(section.imageUrl) || Boolean(section.imageNotes);

  return (
    <div className="max-w-[960px] mx-auto px-6 py-16">
      <div className={`grid gap-10 items-center ${hasImage ? "sm:grid-cols-2" : ""}`}>
        {hasImage && imageSide === "left" && (
          <CmsImage src={section.imageUrl} alt={sectionAlt(section)} label={section.imageNotes} aspect="aspect-[4/3]" className="rounded-2xl" />
        )}
        <div className={hasImage ? "" : "max-w-[680px] mx-auto text-center"}>
          {section.label && <p className="text-sm uppercase tracking-wide text-gold mb-2">{section.label}</p>}
          {section.headline && (
            <h2 className="font-heading text-3xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {section.headline}
            </h2>
          )}
          {section.body && <p className="font-body text-cocoa/80 whitespace-pre-line mb-4">{section.body}</p>}
          {section.ctaLabel && (
            <CtaLink href={section.ctaUrl || DEFAULT_CTA_URL} className="mt-2">
              {section.ctaLabel}
            </CtaLink>
          )}
        </div>
        {hasImage && imageSide === "right" && (
          <CmsImage src={section.imageUrl} alt={sectionAlt(section)} label={section.imageNotes} aspect="aspect-[4/3]" className="rounded-2xl" />
        )}
      </div>
      {(section.videoFileUrl || section.videoUrl) && (
        <div className="mt-10">
          {/* A file uploaded into Notion wins over a platform URL — it's the
              more robust of the two, so if Anthony has provided both he
              presumably means the upload. */}
          {section.videoFileUrl ? (
            <NotionVideo src={section.videoFileUrl} poster={section.imageUrl} />
          ) : (
            <VideoEmbed url={section.videoUrl} title={section.headline || section.section} />
          )}
        </div>
      )}
      {section.pullQuote && <PullQuote>{section.pullQuote}</PullQuote>}
    </div>
  );
}
