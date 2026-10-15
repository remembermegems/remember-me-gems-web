// Hourly trigger for the Notion -> Shopify catalog sync (punch list #25).
// The sync itself lives in src/app/api/cron/sync-catalog/route.ts; this only
// knocks on it with the shared secret. A stone added or restocked in Notion is
// purchasable within the hour instead of failing at checkout until someone
// runs the sync by hand.
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error("[sync-catalog] missing URL or CRON_SECRET — skipping");
    return;
  }
  const res = await fetch(`${base}/api/cron/sync-catalog`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  console.log("[sync-catalog]", res.status, (await res.text()).slice(0, 300));
};

export const config = { schedule: "@hourly" };
