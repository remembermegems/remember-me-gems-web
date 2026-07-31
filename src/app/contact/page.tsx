import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { LinksRow } from "@/components/LinksRow";
import { CtaLink } from "@/components/CtaButton";
import { DEFAULT_CTA_URL } from "@/lib/constants";

export const revalidate = 120;

const KEYPAD: Record<string, string> = {
  A: "2", B: "2", C: "2", D: "3", E: "3", F: "3", G: "4", H: "4", I: "4",
  J: "5", K: "5", L: "5", M: "6", N: "6", O: "6", P: "7", Q: "7", R: "7", S: "7",
  T: "8", U: "8", V: "8", W: "9", X: "9", Y: "9", Z: "9",
};

function toDialable(phone: string): string {
  return phone
    .toUpperCase()
    .split("")
    .map((ch) => KEYPAD[ch] ?? ch)
    .join("")
    .replace(/[^0-9]/g, "");
}

// Contact: deliberately the shortest page. Phone and email in their own
// tap-friendly cards, real tel:/mailto: links (Anthony confirmed this is a
// production requirement), a short row of 3 links, standard closing CTA.
export default async function ContactPage() {
  const sections = await getWebsiteCopy("Contact");
  const hero = sections.find((s) => s.section === "Hero");
  const details = sections.find((s) => s.section === "Contact Details");
  const specific = sections.find((s) => s.section === "Looking for Something Specific?");

  const phoneMatch = details?.body.match(/Phone:\s*([^\n]+)/);
  const phoneDisplay = phoneMatch?.[1]?.trim();
  const phoneNote = details?.body.match(/\(([^)]+)\)/)?.[1];
  const emailMatch = details?.body.match(/Email:\s*(\S+@\S+)/);
  // Notion's Contact Details row doesn't have a real email address filled in
  // yet — falling back to the same placeholder shown in the footer rather
  // than leaving this card blank. Flag to Anthony: needs the real address.
  const email = emailMatch?.[1] ?? "careteam@remembermegems.com";

  return (
    <div>
      {hero && <Hero eyebrow={hero.label} headline={hero.headline} body={hero.body} videoUrl={hero.videoUrl} videoFileUrl={hero.videoFileUrl} />}

      <div className="max-w-[600px] mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {phoneDisplay && (
            <a
              href={`tel:+1${toDialable(phoneDisplay)}`}
              className="rounded-2xl bg-cream px-6 py-8 text-center hover:bg-dusty-sky/20 transition-colors"
            >
              <p className="font-heading text-xl text-cocoa mb-1">{phoneDisplay}</p>
              {phoneNote && <p className="text-sm text-cocoa/60">{phoneNote}</p>}
            </a>
          )}
          <a href={`mailto:${email}`} className="rounded-2xl bg-cream px-6 py-8 text-center hover:bg-dusty-sky/20 transition-colors">
            <p className="font-heading text-xl text-cocoa mb-1">{email}</p>
            <p className="text-sm text-cocoa/60">We answer our own messages</p>
          </a>
        </div>

        {specific?.links && (
          <div className="mb-12">
            <LinksRow links={specific.links} />
          </div>
        )}

        <div className="text-center">
          <CtaLink href={DEFAULT_CTA_URL}>Create Your Remember Me Gem</CtaLink>
        </div>
      </div>
    </div>
  );
}
