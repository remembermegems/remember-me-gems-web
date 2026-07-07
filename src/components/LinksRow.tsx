import Link from "next/link";
import { DEFAULT_CTA_URL } from "@/lib/constants";

// Notion's "Links" field stores display text only ("Contact us →"), not a
// real href, so labels are mapped to routes by keyword. Flagged as an
// inferred mapping, not a guaranteed-correct one — worth confirming with
// Anthony if a label doesn't match what's here.
const ROUTE_KEYWORDS: [RegExp, string][] = [
  [/special request/i, "/special-requests"],
  [/schedule/i, "/special-requests"],
  [/faq/i, "/faq"],
  [/contact/i, "/contact"],
  [/care/i, "/care"],
  [/create your remember me gem|create yours/i, DEFAULT_CTA_URL],
  [/why a remember me gem|what makes a remember me gem different/i, "/why-a-remember-me-gem"],
  [/how we make/i, "/how-we-make-your-gem"],
  [/our story/i, "/our-story"],
  [/available gem|gemstone|our gems?\b/i, "/available-gems"],
  [/symbol/i, "/symbols"],
  [/shape/i, "/shapes"],
  [/how it works/i, "/how-it-works"],
];

function resolveHref(label: string): string {
  for (const [pattern, href] of ROUTE_KEYWORDS) {
    if (pattern.test(label)) return href;
  }
  return "/";
}

// Parses Notion's pipe-separated "Links" field (e.g. "Submit a Special
// Request → | Read our FAQ →") into real navigable links.
export function LinksRow({ links }: { links: string }) {
  const items = links
    .split("|")
    .map((l) => l.trim())
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
      {items.map((label) => (
        <Link key={label} href={resolveHref(label)} className="text-blue underline">
          {label}
        </Link>
      ))}
    </div>
  );
}
