import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { BodyWithLists } from "@/components/BodyWithLists";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";

export const revalidate = 120;

// Care: no hero image (matches the Our Promise/Contact utility-page
// precedent). The "avoid" list gets the muted-dash treatment (a caution, not
// an endorsement); the "delicate stones" list gets the gold-star treatment
// (gentle guidance). See project-rmg-website-cms memory.
export default async function CarePage() {
  const sections = await getWebsiteCopy("Care");
  const hero = sections.find((s) => s.section === "Hero");
  const durability = sections.find((s) => s.section === "Strong, But Not Indestructible");
  const everyday = sections.find((s) => s.section === "Everyday Care");
  const delicate = sections.find((s) => s.section === "A Soft Note on Our More Delicate Stones");
  const closing = sections.find((s) => s.section === "Closing");

  return (
    <div>
      {hero && <Hero eyebrow={hero.label} headline={hero.headline} body={hero.body} videoUrl={hero.videoUrl} videoFileUrl={hero.videoFileUrl} />}

      <div className="max-w-[680px] mx-auto px-6 py-16">
        {durability && (
          <div className="mb-14">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {durability.headline}
            </h2>
            <BodyWithLists body={durability.body} />
          </div>
        )}

        {everyday && (
          <div className="mb-14">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {everyday.headline}
            </h2>
            <BodyWithLists body={everyday.body} listType="dash" />
          </div>
        )}

        {delicate && (
          <div className="mb-14">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {delicate.headline}
            </h2>
            <BodyWithLists body={delicate.body} listType="star" />
          </div>
        )}

        {closing?.body && (
          <p className="font-heading italic text-2xl text-cocoa/90 text-center mb-10 leading-relaxed">{closing.body}</p>
        )}

        <div className="text-center">
          <CtaLink href={DEFAULT_CTA_URL}>Create Your Remember Me Gem</CtaLink>
        </div>
      </div>
    </div>
  );
}
