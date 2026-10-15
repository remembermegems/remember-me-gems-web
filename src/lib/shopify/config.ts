// Shopify app + store configuration.
//
// The shop domain and client ID aren't secrets (the client ID is visible in
// the authorize URL the merchant's browser hits). The client secret and the
// resulting Admin API access token are — both live only in .env.local, which
// is gitignored.

export const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN ?? "6efx6j-bz.myshopify.com";

// Admin API version. Shopify dates its releases quarterly and supports each
// for 12 months; bumping this is a deliberate act, not something to leave
// floating, because a version change can alter response shapes.
//
// Bumped from 2025-07 to 2025-10 on 2026-09-11 (punch list #34, reconnecting
// to the new Shopify store) — 2025-07 had aged out of Shopify's supported
// window entirely (no longer even selectable in the app's webhook API
// version dropdown), so this wasn't optional drift, the old pin was already
// dead. Picked 2025-10 as the smallest available jump over newer options
// (2026-01/04/07) to minimize the odds of an unreviewed response-shape
// change landing at the same time as the store migration.
export const SHOPIFY_API_VERSION = "2025-10";

// Scopes requested during OAuth. Keep this list minimal and deliberate — every
// scope has to be re-approved by the merchant if it changes, and an app that
// asks for more than it uses is a liability.
//
//   read/write_products       — create and sync the one-product-per-stone catalog
//   read/write_publications   — publish synced products to the Headless sales channel
//   read_orders               — read paid orders (the orders/paid webhook payload)
//   read/write_files          — upload the rendered gem PNG to Shopify's own file
//                               storage for a stable CDN URL (punch list #31,
//                               added 2026-09-11 during the #34 reconnect so this
//                               doesn't need a second owner-access round-trip
//                               later — not used by any code yet)
//
// Inventory tracking is deliberately off (inventoryItem.tracked: false in
// catalog.ts) — Notion stays the real inventory source of truth — so no
// inventory scope is requested.
export const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_publications",
  "write_publications",
  "read_orders",
  "read_files",
  "write_files",
].join(",");

export function shopifyClientId(): string {
  return process.env.SHOPIFY_CLIENT_ID ?? "";
}

export function shopifyClientSecret(): string {
  return process.env.SHOPIFY_CLIENT_SECRET ?? "";
}

// Present only after the one-time OAuth exchange has been completed and the
// token pasted into .env.local.
export function shopifyAdminToken(): string {
  return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "";
}

export function hasShopifyOAuthApp(): boolean {
  return Boolean(shopifyClientId() && shopifyClientSecret());
}

export function hasShopifyAdminToken(): boolean {
  return Boolean(shopifyAdminToken());
}

export function shopifyRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/shopify/callback`;
}
