import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { CmsImage } from "@/components/CmsImage";
import { sectionAlt } from "@/lib/altText";
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

export default async function SpecialRequestsPage() {
  const sections = await getWebsiteCopy("Special Requests");
  const hero = sections.find((s) => s.section === "Hero");
  const bodySection = sections.find((s) => s.section === "Body");
  const scheduleSection = sections.find((s) => s.section === "Schedule a Conversation");

  const { paragraphs, bullets } = bodySection ? splitBodyAndBullets(bodySection.body) : { paragraphs: "", bullets: [] };

  return (
    <div>
      <Hero headline={hero?.headline || "Special Requests"} body={hero?.body} videoUrl={hero?.videoUrl} videoFileUrl={hero?.videoFileUrl} />
      {/* Single hero photo, 1200x800 (3:2) — replaces the 3-tile montage
          placeholder (2026-07-31); Anthony didn't end up shooting the range
          of example pieces that called for. Reads from the same "Hero" row's
          Image field as every other page's single hero photo. */}
      <div className="max-w-[880px] mx-auto px-6 mb-12">
        <CmsImage
          src={hero?.imageUrl ?? null}
          alt={hero ? sectionAlt(hero) : "Special Requests"}
          label={hero?.imageNotes || "Custom special request, hand-carved"}
          aspect="aspect-[3/2]"
          className="rounded-3xl"
        />
      </div>
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
