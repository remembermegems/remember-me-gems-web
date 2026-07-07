import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { CmsImage } from "@/components/CmsImage";
import { PullQuote } from "@/components/PullQuote";
import { LinksRow } from "@/components/LinksRow";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";
import { WatermarkSection } from "@/components/Watermark";

// A "keepsake print" photo — white matte border and soft shadow like a
// printed photo, tilted a few degrees, drifting toward one side. Reserved
// for this page only (Anthony's call — see project-rmg-website-cms memory);
// don't reuse this treatment elsewhere without checking with him.
function KeepsakePhoto({ src, label, drift }: { src: string | null; label?: string; drift: "left" | "right" }) {
  return (
    <div
      className={`bg-white p-3 pb-6 shadow-lg max-w-[420px] mb-10 ${
        drift === "left" ? "-rotate-2 mr-auto" : "rotate-2 ml-auto"
      }`}
    >
      <CmsImage src={src} alt={label ?? "Our Story"} label={label} aspect="aspect-[3/2]" />
    </div>
  );
}

// Our Story, built as one continuous letter — no visible part headers or
// dividers (Anthony's explicit call: this is the most personal page on the
// site, treated as a letter rather than an essay or catalog). Photos get the
// keepsake print treatment; everything else just flows as one narrative.
export async function OurStoryPage() {
  const sections = await getWebsiteCopy("Our Story");
  const hero = sections.find((s) => s.section === "Hero");
  const partOne = sections.find((s) => /Part One/i.test(s.section));
  const partTwo = sections.find((s) => /Part Two/i.test(s.section));
  const partThree = sections.find((s) => /Part Three/i.test(s.section));
  const closing = sections.find((s) => s.section === "CTA");

  return (
    <div>
      <Hero headline={hero?.headline || "Our Story"} />

      <WatermarkSection side="left" tint="cream" watermark className="py-16">
        <div className="max-w-[640px] mx-auto px-6">
          {partOne && (
            <>
              <KeepsakePhoto src={partOne.imageUrl} label={partOne.imageNotes} drift="right" />
              <p className="font-body text-cocoa/80 whitespace-pre-line mb-10">{partOne.body}</p>
            </>
          )}
          {partTwo && (
            <>
              <KeepsakePhoto src={partTwo.imageUrl} label={partTwo.imageNotes} drift="left" />
              <p className="font-body text-cocoa/80 whitespace-pre-line mb-4">{partTwo.body}</p>
              {partTwo.pullQuote && <PullQuote>{partTwo.pullQuote}</PullQuote>}
            </>
          )}
          {partThree && (
            <>
              <p className="font-body text-cocoa/80 whitespace-pre-line mb-6">{partThree.body}</p>
              {partThree.links && <LinksRow links={partThree.links} />}
            </>
          )}
        </div>
      </WatermarkSection>

      {closing?.ctaLabel && (
        <div className="text-center py-16">
          <CtaLink href={closing.ctaUrl || DEFAULT_CTA_URL}>{closing.ctaLabel}</CtaLink>
        </div>
      )}
    </div>
  );
}
