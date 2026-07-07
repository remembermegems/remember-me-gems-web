// Database IDs are not secrets — resolved once via Notion search/fetch on 2026-07-02.
// Only NOTION_TOKEN (in .env.local) is sensitive.
export const NOTION_DB = {
  websiteCopy: "07a10b4e-db21-4760-9747-d88b090148e2",
  configuratorCopy: "02f2cfb8-b22a-409f-a321-b495e14ca41e",
  stones: "0f824f46-26b9-4fbe-ba90-5706f6b4b138",
  symbols: "7e0e14ea-a8b9-47d4-acc9-c92eb045aa32",
  orders: "87ee3958-e4fe-41f1-b288-006ae6a2970c",
} as const;

export const NOTION_VERSION = "2022-06-28";
