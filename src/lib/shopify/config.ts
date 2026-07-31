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
export const SHOPIFY_API_VERSION = "2025-07";

// Scopes requested during OAuth. Keep this list minimal and deliberate — every
// scope has to be re-approved by the merchant if it changes, and an app that
// asks for more than it uses is a liability.
//
//   read/write_products   — create and sync the one-product-per-stone catalog
//   read/write_inventory  — decrement stone inventory as gems are ordered
//   read_orders           — read paid orders (the orders/paid webhook payload)
export const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_inventory",
  "write_inventory",
  "read_orders",
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
