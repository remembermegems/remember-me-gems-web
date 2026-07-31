import type { Stone, WebsiteCopySection } from "@/lib/notion/types";

// Resolves the alt text for a CMS image.
//
// The "Alt Text" Notion field is the real answer — a description of what's
// actually in the photo, which is what a screen reader announces and what
// image search reads. Everything after it is a fallback for rows Anthony
// hasn't filled in yet: `imageNotes` is the placeholder-era brief ("founder
// portrait"), which at least describes the intended subject, and headline /
// section describe the surrounding content rather than the picture.
//
// Deliberately never returns "" for a content image — an empty alt tells
// assistive tech the image is decorative and can be skipped entirely, which
// would be a worse lie than an imperfect description.
export function sectionAlt(section: WebsiteCopySection): string {
  return section.altText || section.imageNotes || section.headline || section.section;
}

// Same idea for stone photography. The stone name alone names the subject
// without describing it ("Malachite" tells a screen-reader user nothing about
// what the photo shows), so it's the last resort, not the answer.
export function stoneAlt(stone: Stone): string {
  return stone.imageAltText || stone.name;
}
