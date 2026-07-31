import { NOTION_DB } from "./config";
import { hasNotionToken, queryAllRows, text, num, fileUrl, type NotionPage } from "./client";
import type { WebsiteCopySection, WebsitePage } from "./types";
import { mockWebsiteCopy } from "@/lib/mock/websiteCopy";

function mapRow(page: NotionPage): WebsiteCopySection {
  return {
    id: page.id,
    page: (page.properties["Page"]?.select?.name ?? "Home") as WebsitePage,
    section: text(page, "Section"),
    displayOrder: num(page, "Display Order") ?? 0,
    label: text(page, "Label"),
    headline: text(page, "Headline"),
    body: text(page, "Body"),
    pullQuote: text(page, "Pull Quote"),
    links: text(page, "Links"),
    ctaLabel: text(page, "CTA Label"),
    ctaUrl: text(page, "CTA URL"),
    imageUrl: fileUrl(page, "Image"),
    imageNotes: text(page, "Image Notes"),
    altText: text(page, "Alt Text"),
    videoUrl: text(page, "Video URL"),
    videoFileUrl: fileUrl(page, "Video"),
    notes: text(page, "Notes"),
  };
}

export async function getWebsiteCopy(page: WebsitePage): Promise<WebsiteCopySection[]> {
  if (!hasNotionToken()) {
    return mockWebsiteCopy.filter((s) => s.page === page).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const rows = await queryAllRows(NOTION_DB.websiteCopy, {
    property: "Page",
    select: { equals: page },
  });

  return rows.map(mapRow).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAllWebsiteCopy(): Promise<WebsiteCopySection[]> {
  if (!hasNotionToken()) {
    return mockWebsiteCopy.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  const rows = await queryAllRows(NOTION_DB.websiteCopy);
  return rows.map(mapRow).sort((a, b) => a.displayOrder - b.displayOrder);
}
