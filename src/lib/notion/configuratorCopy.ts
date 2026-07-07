import { NOTION_DB } from "./config";
import { hasNotionToken, queryAllRows, text, type NotionPage } from "./client";
import type { ConfiguratorCopyRow, ConfiguratorStep } from "./types";
import { mockConfiguratorCopy } from "@/lib/mock/configuratorCopy";

function mapRow(page: NotionPage): ConfiguratorCopyRow {
  return {
    id: page.id,
    key: text(page, "Key"),
    step: (page.properties["Step"]?.select?.name ?? "Global") as ConfiguratorStep,
    type: page.properties["Type"]?.select?.name ?? "",
    text: text(page, "Text"),
    channel: (page.properties["Channel"]?.select?.name ?? "Both") as ConfiguratorCopyRow["channel"],
    notes: text(page, "Notes"),
  };
}

// Returns a Key -> Text lookup, filtered to rows usable on the Web channel.
// A plain Record (not a Map) so this can be passed as a prop from a Server
// Component straight into "use client" Studio screens — Map isn't
// serializable across that boundary. Relies on Next's fetch-level
// revalidation inside queryAllRows for freshness (a module-level cache here
// would never pick up Notion edits without a restart).
export async function getConfiguratorCopy(): Promise<Record<string, string>> {
  const rows = hasNotionToken()
    ? (await queryAllRows(NOTION_DB.configuratorCopy)).map(mapRow)
    : mockConfiguratorCopy;

  const webRows = rows.filter((r) => r.channel === "Web" || r.channel === "Both");
  return Object.fromEntries(webRows.map((r) => [r.key, r.text]));
}

export function copyText(copy: Record<string, string>, key: string, fallback = ""): string {
  return copy[key] ?? fallback;
}
