import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { CmsImage } from "@/components/CmsImage";
import { DiamondList } from "@/components/ListMarkers";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";

export const revalidate = 120;

// Splits the "Body" row into its leading paragraphs and its trailing bullet
// examples (Notion stores both in one field, bullets as "- " lines).
function splitBodyAndBullets(body: string): { paragraphs: string; bullets: string[] } {
  const lines = body.split("\n");
  const bulletStart = lines.findIndex((l) => l.trim().startsWith("- "));
  if (bulletStart === -1) return { paragraphs: body, bullets: [] };
  return {
    paragraphs: lines.slice(0, bulletStart).join("\n").trim(),
    bullets: lines.slice(bulletStart).map((l) => l.replace(/^-\s*/, "").trim()).filter(Boolean),
  };
}

// The 3-tile montage strip — a wide tile plus two smaller ones, standing in
// for a hero photo Anthony hasn't shot yet (he plans to photograph custom
// special-request pieces to show range). Reads as an intentional curated
// gallery even fully gray, so no redesign is needed once real photos land
// one tile at a time. See project-rmg-website-cms memory.
function MontageStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-[880px] mx-auto px-6 mb-12">
      <div className="aspect-[3/2] sm:aspect-auto sm:row-span-2">
        {/* No aspect class on mobile-vs-desktop mismatch here: on sm+ this
            tile's height is already fully determined by spanning both grid
            rows, so pairing an aspect-ratio with h-full would fight over
            which one wins the width — drop aspect-ratio and just fill. */}
        <CmsImage
          src={null}
          alt="Special requests"
          label="Custom special request, hand-carved"
          aspect=""
          className="rounded-2xl w-full h-full"
        />
      </div>
      <CmsImage src={null} alt="Special requests" label="Special request example" aspect="aspect-square" className="rounded-2xl" />
      <CmsImage src={null} alt="Special requests" label="Special request example" aspect="aspect-square" className="rounded-2xl" />
    </div>
  );
}

export default async function SpecialRequestsPage() {
  const sections = await getWebsiteCopy("Special Requests");
  const hero = sections.find((s) => s.section === "Hero");
  const bodySection = sections.find((s) => s.section === "Body");
  const scheduleSection = sections.find((s) => s.section === "Schedule a Conversation");

  const { paragraphs, bullets } = bodySection ? splitBodyAndBullets(bodySection.body) : { paragraphs: "", bullets: [] };

  return (
    <div>
      <Hero headline={hero?.headline || "Special Requests"} body={hero?.body} />
      <MontageStrip />
      {paragraphs && (
        <div className="max-w-[680px] mx-auto px-6">
          <p className="font-body text-cocoa/80 whitespace-pre-line mb-8">{paragraphs}</p>
        </div>
      )}
      {bullets.length > 0 && (
        <div className="max-w-[680px] mx-auto px-6 mb-12">
          <DiamondList items={bullets} />
        </div>
      )}
      {scheduleSection?.headline && (
        <div className="max-w-[680px] mx-auto px-6 text-center mb-6">
          <h2 className="font-heading text-2xl text-cocoa mb-3" style={{ color: "#4E3F35" }}>
            {scheduleSection.headline}
          </h2>
          {scheduleSection.body && <p className="font-body text-cocoa/80">{scheduleSection.body}</p>}
        </div>
      )}
      {scheduleSection?.notes && <CalendlyEmbed snippet={scheduleSection.notes} />}
    </div>
  );
}
