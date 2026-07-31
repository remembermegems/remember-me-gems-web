import {
  SHOPIFY_SHOP_DOMAIN,
  SHOPIFY_API_VERSION,
  shopifyAdminToken,
  hasShopifyAdminToken,
} from "./config";

export const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";

export function hasShopifyStorefrontToken(): boolean {
  return Boolean(SHOPIFY_STOREFRONT_TOKEN);
}

// Paused 2026-07-29: Shopify's payment gateway needs business-verification
// documents Anthony doesn't have in hand yet (est. several days to a week).
// The Storefront token stays configured and every product/webhook piece stays
// built — this flag is the single point that keeps checkout from routing
// through Shopify while payments can't actually process there. Flip
// SHOPIFY_CHECKOUT_PAUSED to "false" (or unset it) in .env.local to resume;
// nothing else needs to change. Deliberately checked here rather than deleted
// or commented out upstream, so resuming isn't a rebuild.
export function hasShopifyCheckout(): boolean {
  if (process.env.SHOPIFY_CHECKOUT_PAUSED === "true") return false;
  return hasShopifyStorefrontToken();
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
};

class ShopifyGraphQLError extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message);
    this.name = "ShopifyGraphQLError";
  }
}

// GraphQL transport errors and in-payload `errors` are both failures, but only
// the former shows up as a bad HTTP status — Shopify returns 200 with an
// `errors` array for things like ACCESS_DENIED. Both are raised here so no
// caller has to remember to check twice.
async function graphql<T>(
  url: string,
  headers: Record<string, string>,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new ShopifyGraphQLError(`Shopify request failed (${res.status})`, text.slice(0, 800));
  }

  let json: GraphQLResponse<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ShopifyGraphQLError("Shopify returned non-JSON", text.slice(0, 400));
  }

  if (json.errors?.length) {
    throw new ShopifyGraphQLError(json.errors.map((e) => e.message).join("; "), json.errors);
  }
  if (!json.data) throw new ShopifyGraphQLError("Shopify returned no data");
  return json.data;
}

export function adminGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyAdminToken()) {
    throw new ShopifyGraphQLError(
      "SHOPIFY_ADMIN_ACCESS_TOKEN is not set — run the one-time /api/shopify/install handshake first."
    );
  }
  return graphql<T>(
    `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    { "X-Shopify-Access-Token": shopifyAdminToken() },
    query,
    variables
  );
}

export function storefrontGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyStorefrontToken()) {
    throw new ShopifyGraphQLError(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set — create a storefront in the Headless channel."
    );
  }
  return graphql<T>(
    `https://${SHOPIFY_SHOP_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    { "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN },
    query,
    variables
  );
}

// Shopify's `userErrors` are business-rule rejections (bad price, duplicate
// handle) returned inside a successful response. Silently ignoring them is how
// a "successful" sync ends up having written nothing.
export function assertNoUserErrors(userErrors: { field?: string[] | null; message: string }[] | undefined, context: string) {
  if (userErrors && userErrors.length > 0) {
    const detail = userErrors.map((e) => `${(e.field ?? []).join(".")}: ${e.message}`).join("; ");
    throw new ShopifyGraphQLError(`${context} — ${detail}`, userErrors);
  }
}

export { ShopifyGraphQLError };
