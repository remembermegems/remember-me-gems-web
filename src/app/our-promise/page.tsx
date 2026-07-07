import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { BodyWithLists } from "@/components/BodyWithLists";
import { LinksRow } from "@/components/LinksRow";
import { CtaLink } from "@/components/CtaButton";

export const revalidate = 120;

// Our Promise: no photos anywhere, pure trust/reassurance page. Deliberately
// the one page that closes on "Contact Us ->" instead of the standard
// "Create Your Remember Me Gem" button (see project-rmg-website-cms memory)
// — the CTA is everywhere else already, and nobody reads this page unless
// something's already wrong, so the funnel button would be tonally wrong.
export default async function OurPromisePage() {
  const sections = await getWebsiteCopy("Our Promise");
  const hero = sections.find((s) => s.section === "Hero");
  const guarantee = sections.find((s) => s.section === "Our Craftsmanship Guarantee");
  const stoneNote = sections.find((s) => s.section === "A Note About the Nature of Stone");
  const closing = sections.find((s) => s.section === "Get in Touch");

  return (
    <div>
      {hero && <Hero eyebrow={hero.label} headline={hero.headline} body={hero.body} />}

      <div className="max-w-[680px] mx-auto px-6 py-16">
        {guarantee && (
          <div className="mb-14">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {guarantee.headline}
            </h2>
            <BodyWithLists body={guarantee.body} listType="check" />
          </div>
        )}

        {stoneNote && (
          <div className="mb-14">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {stoneNote.headline}
            </h2>
            <BodyWithLists body={stoneNote.body} />
            {stoneNote.links && (
              <div className="mt-2">
                <LinksRow links={stoneNote.links} />
              </div>
            )}
          </div>
        )}

        {closing && (
          <div className="text-center">
            <h2 className="font-heading text-2xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
              {closing.headline}
            </h2>
            <p className="font-body text-cocoa/80 mb-6">{closing.body}</p>
            <CtaLink href="/contact">{closing.links || "Contact Us →"}</CtaLink>
          </div>
        )}
      </div>
    </div>
  );
}
