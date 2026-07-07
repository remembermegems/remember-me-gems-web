/* eslint-disable @typescript-eslint/no-explicit-any -- this file is the boundary layer parsing Notion's loosely-typed REST JSON; typing every property-value union isn't worth it for the alpha. */
import { NOTION_VERSION } from "./config";

const NOTION_API = "https://api.notion.com/v1";

export function hasNotionToken() {
  return Boolean(process.env.NOTION_TOKEN);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export type NotionPage = {
  id: string;
  properties: Record<string, any>;
};

// Queries every row of a database, paginating until exhausted.
export async function queryAllRows(
  databaseId: string,
  filter?: Record<string, any>
): Promise<NotionPage[]> {
  const rows: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        start_cursor: cursor,
        page_size: 100,
        ...(filter ? { filter } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion query failed (${res.status}) for ${databaseId}: ${body}`);
    }

    const json = await res.json();
    rows.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);

  return rows;
}

export async function createPage(databaseId: string, properties: Record<string, any>) {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion create page failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function getPage(pageId: string): Promise<NotionPage> {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    headers: headers(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion get page failed (${res.status}) for ${pageId}: ${body}`);
  }

  return res.json();
}

export async function updatePage(pageId: string, properties: Record<string, any>) {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion update page failed (${res.status}) for ${pageId}: ${body}`);
  }

  return res.json();
}

// --- Property readers (Notion's REST shape is verbose; these flatten it) ---

export function text(page: NotionPage, prop: string): string {
  const p = page.properties[prop];
  if (!p) return "";
  if (p.type === "title") return p.title.map((t: any) => t.plain_text).join("");
  if (p.type === "rich_text") return p.rich_text.map((t: any) => t.plain_text).join("");
  return "";
}

export function select(page: NotionPage, prop: string): string | null {
  const p = page.properties[prop];
  return p?.select?.name ?? null;
}

export function multiSelect(page: NotionPage, prop: string): string[] {
  const p = page.properties[prop];
  return (p?.multi_select ?? []).map((o: any) => o.name);
}

export function checkbox(page: NotionPage, prop: string): boolean {
  return Boolean(page.properties[prop]?.checkbox);
}

export function num(page: NotionPage, prop: string): number | null {
  const p = page.properties[prop];
  return typeof p?.number === "number" ? p.number : null;
}

export function fileUrl(page: NotionPage, prop: string): string | null {
  const p = page.properties[prop];
  const file = p?.files?.[0];
  if (!file) return null;
  return file.type === "external" ? file.external.url : file.file?.url ?? null;
}
