// Notion's Body field embeds lists as plain "- " markdown lines within one
// text blob rather than as separate structured rows. This splits a body into
// alternating prose paragraphs and list blocks so each can get its own
// marker treatment (checkmark/dash/star/diamond) per the design system.
export type BodyBlock = { type: "prose"; text: string } | { type: "list"; items: string[] };

export function parseBodyBlocks(body: string): BodyBlock[] {
  const paragraphs = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const blocks: BodyBlock[] = [];

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim());
    const isList = lines.every((l) => l.startsWith("- "));
    if (isList && lines.length > 0) {
      blocks.push({ type: "list", items: lines.map((l) => l.slice(2)) });
    } else {
      blocks.push({ type: "prose", text: para });
    }
  }

  return blocks;
}
