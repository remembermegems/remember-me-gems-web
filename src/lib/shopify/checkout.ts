import type { OrderInput } from "@/lib/notion/types";
import type { ResolvedAddOn } from "@/lib/studio/pricing";
import { storefrontGraphQL } from "./client";
import { addOnSku, stoneSku } from "./catalog";

// Builds a Shopify cart from the gems in this order and returns the hosted
// checkout URL. Replaces the Square Checkout Link (punch list #25).
//
// Shape, per the native-catalog decision:
//   - one line per gem, pointing at that stone's product
//   - one extra line per add-on (touchstone / petite / custom symbol)
//   - all personalization rides along as line-item attributes, which Shopify
//     surfaces on the order for production — they're not products or variants
//
// Prices come from the Shopify catalog, not from us: the amount charged is
// whatever the synced product says, so a stale sync shows up as a wrong price
// rather than a silently unchargeable order. That's why the sync has to run
// after any Notion price change.

const CART_CREATE = /* GraphQL */ `
  mutation RmgCartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const VARIANTS_BY_SKU = /* GraphQL */ `
  query RmgVariantsBySku($query: String!) {
    products(first: 50, query: $query) {
      nodes {
        variants(first: 1) {
          nodes {
            id
            sku
          }
        }
      }
    }
  }
`;

type CartAttribute = { key: string; value: string };

// Resolves SKU -> Storefront variant GID. A SKU that doesn't come back means
// the Shopify catalog is out of step with Notion (usually a stone restocked
// above the reserve without re-running the sync) — the caller turns that into
// a clear error rather than an empty cart or a mystery 500.
export async function resolveVariantIds(skus: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(skus));
  if (unique.length === 0) return new Map();

  const query = unique.map((sku) => `sku:${JSON.stringify(sku)}`).join(" OR ");
  const data = await storefrontGraphQL<{
    products: { nodes: { variants: { nodes: { id: string; sku: string }[] } }[] };
  }>(VARIANTS_BY_SKU, { query });

  const map = new Map<string, string>();
  for (const product of data.products.nodes) {
    for (const variant of product.variants.nodes) {
      if (variant.sku) map.set(variant.sku, variant.id);
    }
  }
  return map;
}

function gemAttributes(order: OrderInput, index: number): CartAttribute[] {
  const years = [order.birthYear, order.deathYear].filter(Boolean).join("–");
  const attrs: CartAttribute[] = [
    { key: "Gem", value: `${index + 1}` },
    { key: "In memory of", value: `${order.firstName} ${order.lastName}`.trim() },
    { key: "Shape", value: order.shapeName },
    { key: "Inlay color", value: order.inlayColor },
  ];
  if (years) attrs.push({ key: "Years", value: years });
  if (order.carryType) attrs.push({ key: "How they'll keep it close", value: order.carryType });
  if (order.symbolName) attrs.push({ key: "Symbol", value: order.symbolName });
  // Lettering only means something when there's an engraving to letter.
  if (order.initials) {
    attrs.push({ key: "Initials", value: order.initials });
    attrs.push({ key: "Lettering style", value: order.letteringStyle });
  } else {
    attrs.push({ key: "Initials", value: "None — customer declined" });
  }

  // Machine-readable duplicates for the orders/paid webhook to rebuild the
  // Notion row from. Shopify hides attributes whose key starts with "_" from
  // the customer and from the order display, so this doesn't clutter what
  // Anthony reads in the admin.
  //
  // These exist because the human-readable versions above aren't safely
  // reversible — "In memory of: Jane Van Der Berg" can't be split back into
  // first and last name without guessing, and guessing wrong would engrave
  // the wrong thing.
  attrs.push(
    { key: "_first_name", value: order.firstName },
    { key: "_last_name", value: order.lastName },
    { key: "_birth_year", value: order.birthYear ?? "" },
    { key: "_death_year", value: order.deathYear ?? "" },
    { key: "_stone_id", value: order.stoneId },
    { key: "_stone_name", value: order.stoneName },
    { key: "_shape_name", value: order.shapeName },
    { key: "_symbol_name", value: order.symbolName },
    { key: "_inlay_color", value: order.inlayColor },
    { key: "_lettering_style", value: order.letteringStyle },
    { key: "_initials", value: order.initials },
    { key: "_carry_type", value: order.carryType ?? "" },
    { key: "_base_price", value: String(order.basePrice) },
    { key: "_total_price", value: String(order.totalPrice) },
    { key: "_add_ons", value: order.addOns.join(", ") },
    { key: "_beta_mode", value: String(order.betaMode) }
  );

  return attrs;
}

export type CartLinePlan = { sku: string; quantity: number; attributes: CartAttribute[] };

export function buildCartLines(orders: OrderInput[], addOnsPerOrder: ResolvedAddOn[][]): CartLinePlan[] {
  const lines: CartLinePlan[] = [];
  orders.forEach((order, i) => {
    const attributes = gemAttributes(order, i);
    lines.push({ sku: stoneSku(order.stoneName), quantity: 1, attributes });
    for (const addOn of addOnsPerOrder[i] ?? []) {
      lines.push({
        sku: addOnSku(addOn.kind, addOn.amount),
        quantity: 1,
        // Tie the add-on back to the gem it belongs to, or a two-gem order
        // arrives in production with loose upcharges and no way to tell which
        // piece they apply to.
        attributes: [
          { key: "Gem", value: `${i + 1}` },
          { key: "For", value: `${order.stoneName} — ${order.shapeName}` },
        ],
      });
    }
  });
  return lines;
}

export class ShopifyCatalogOutOfSyncError extends Error {
  constructor(readonly missingSkus: string[]) {
    super(
      `Shopify is missing ${missingSkus.length} product(s): ${missingSkus.join(", ")}. ` +
        `Run: npx tsx --env-file=.env.local scripts/shopify-sync-catalog.ts --apply`
    );
    this.name = "ShopifyCatalogOutOfSyncError";
  }
}

export type CheckoutCustomer = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
};

// The Studio collects a shipping address before checkout (built when Square
// hosted payment and never asked for one). Shopify's checkout asks again — so
// without this the customer types their address twice, which is a rough thing
// to put in front of someone ordering a memorial. Prefilling means Shopify's
// form arrives already populated and they just confirm.
function buyerIdentityFor(customer: CheckoutCustomer) {
  const [firstName, ...rest] = (customer.customerName ?? "").trim().split(/\s+/);
  const hasAddress = Boolean(customer.streetAddress && customer.city && customer.state && customer.zip);

  const identity: Record<string, unknown> = {};
  if (customer.customerEmail) identity.email = customer.customerEmail;
  if (customer.customerPhone) identity.phone = customer.customerPhone;
  if (hasAddress) {
    identity.deliveryAddressPreferences = [
      {
        deliveryAddress: {
          address1: customer.streetAddress,
          city: customer.city,
          provinceCode: customer.state,
          zip: customer.zip,
          countryCode: "US",
          ...(firstName ? { firstName } : {}),
          ...(rest.length ? { lastName: rest.join(" ") } : {}),
          ...(customer.customerPhone ? { phone: customer.customerPhone } : {}),
        },
      },
    ];
  }
  return Object.keys(identity).length > 0 ? identity : null;
}

export async function createShopifyCheckout({
  orders,
  addOnsPerOrder,
  orderId,
  customer = {},
}: {
  orders: OrderInput[];
  addOnsPerOrder: ResolvedAddOn[][];
  orderId: string;
  customer?: CheckoutCustomer;
}): Promise<{ checkoutUrl: string; cartId: string; total: string }> {
  const plan = buildCartLines(orders, addOnsPerOrder);
  const variantBySku = await resolveVariantIds(plan.map((l) => l.sku));

  const missing = Array.from(new Set(plan.map((l) => l.sku).filter((sku) => !variantBySku.has(sku))));
  if (missing.length > 0) throw new ShopifyCatalogOutOfSyncError(missing);

  const data = await storefrontGraphQL<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string; cost: { totalAmount: { amount: string } } } | null;
      userErrors: { field?: string[] | null; message: string }[];
    };
  }>(CART_CREATE, {
    input: {
      // Shared across every gem in this checkout so the Notion order rows and
      // the Shopify order can be reconciled later.
      attributes: [{ key: "RMG Order ID", value: orderId }],
      ...(buyerIdentityFor(customer) ? { buyerIdentity: buyerIdentityFor(customer) } : {}),
      lines: plan.map((line) => ({
        merchandiseId: variantBySku.get(line.sku)!,
        quantity: line.quantity,
        attributes: line.attributes,
      })),
    },
  });

  const { cart, userErrors } = data.cartCreate;
  if (userErrors?.length) {
    throw new Error(`cartCreate — ${userErrors.map((e) => e.message).join("; ")}`);
  }
  if (!cart) throw new Error("cartCreate returned no cart");

  return { checkoutUrl: cart.checkoutUrl, cartId: cart.id, total: cart.cost.totalAmount.amount };
}
