import type { Stone } from "@/lib/notion/types";
import { SHAPE_ADDON_PRICE } from "@/lib/studio/shapes";
import { CUSTOM_SYMBOL_ADDON } from "@/lib/studio/pricing";
import { adminGraphQL, assertNoUserErrors } from "./client";

// Catalog shape, per docs/studio-punch-list.md #25:
//   - one real Shopify product per stone, carrying its actual price
//   - touchstone upcharge / petite shape / custom symbol as flat-fee add-on
//     products, added as their own line items
//   - everything else (initials, dedication, lettering, inlay, symbol) rides
//     along as free-text line-item properties, not products
//
// Net result is ~24 products, not one per possible gem combination.

export const STONE_SKU_PREFIX = "RMG-STONE";
export const ADDON_SKU_PREFIX = "RMG-ADDON";

export function handleFor(name: string, prefix = "rmg"): string {
  const slug = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}-${slug}`;
}

function skuFor(prefix: string, name: string): string {
  return `${prefix}-${handleFor(name, "").replace(/^-/, "").toUpperCase()}`;
}

// The SKU is the contract between the catalog sync (which creates products)
// and checkout (which looks them up). Both sides call these, so a change to
// the naming can't silently break the lookup on one side only.
export function stoneSku(stoneName: string): string {
  return skuFor(STONE_SKU_PREFIX, stoneName);
}

export function addOnSku(kind: "touchstone" | "petite" | "custom-symbol", amount: number): string {
  switch (kind) {
    case "touchstone":
      return `${ADDON_SKU_PREFIX}-TOUCHSTONE-${amount}`;
    case "petite":
      return `${ADDON_SKU_PREFIX}-PETITE`;
    case "custom-symbol":
      return `${ADDON_SKU_PREFIX}-CUSTOM-SYMBOL`;
  }
}

export type CatalogProduct = {
  kind: "stone" | "addon";
  handle: string;
  title: string;
  sku: string;
  price: number;
  description: string;
};

export type AddOnKind = "touchstone" | "petite" | "custom-symbol";

// Add-on prices are flat and known at build time, EXCEPT the touchstone
// upcharge, which is per-stone in Notion. Every distinct non-zero upcharge
// present in the catalog gets its own add-on product, so a stone with a
// different upcharge later can't silently be charged the wrong amount — the
// alternative (one fixed "touchstone" product) would break the moment Anthony
// prices a stone differently.
export function buildCatalogPlan(stones: Stone[], betaMode: boolean): CatalogProduct[] {
  const forSale = stones.filter((s) => s.availableForSale);

  const stoneProducts: CatalogProduct[] = forSale.map((stone) => {
    const price = betaMode ? stone.betaPrice : stone.launchPrice;
    return {
      kind: "stone",
      handle: handleFor(stone.name),
      title: `Remember Me Gem — ${stone.name}`,
      sku: stoneSku(stone.name),
      price,
      description:
        stone.stoneDescription ||
        `A handcrafted Remember Me Gem in ${stone.name}, with your loved one's ashes inlaid and a symbol and initials engraved.`,
    };
  });

  const upcharges = Array.from(
    new Set(forSale.map((s) => s.touchstoneUpcharge).filter((v) => v > 0))
  ).sort((a, b) => a - b);

  const addOns: CatalogProduct[] = [
    ...upcharges.map<CatalogProduct>((amount) => ({
      kind: "addon",
      handle: handleFor(`touchstone upcharge ${amount}`, "rmg-addon"),
      title: `Touchstone upcharge ($${amount})`,
      sku: addOnSku("touchstone", amount),
      price: amount,
      description: "Additional cost for the larger touchstone size on this gemstone.",
    })),
    {
      kind: "addon",
      handle: handleFor("petite shape", "rmg-addon"),
      title: `Petite shape (+$${SHAPE_ADDON_PRICE})`,
      sku: addOnSku("petite", SHAPE_ADDON_PRICE),
      price: SHAPE_ADDON_PRICE,
      description: "Additional cost for the extra cutting and finishing a petite shape requires.",
    },
    {
      kind: "addon",
      handle: handleFor("custom symbol", "rmg-addon"),
      title: `Custom symbol (+$${CUSTOM_SYMBOL_ADDON})`,
      sku: addOnSku("custom-symbol", CUSTOM_SYMBOL_ADDON),
      price: CUSTOM_SYMBOL_ADDON,
      description: "Additional cost for engraving a custom symbol that isn't in the standard library.",
    },
  ];

  return [...stoneProducts, ...addOns];
}

// `identifier` is what makes this an upsert — it's how productSet looks up an
// existing product. Setting `handle` inside `input` alone does NOT do that:
// the mutation then tries to create, and fails with "Handle already in use"
// on every run after the first.
const PRODUCT_SET = /* GraphQL */ `
  mutation RmgProductSet($identifier: ProductSetIdentifiers!, $input: ProductSetInput!) {
    productSet(synchronous: true, identifier: $identifier, input: $input) {
      product {
        id
        handle
        title
        variants(first: 1) {
          nodes {
            id
            sku
            price
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

type ProductSetResult = {
  productSet: {
    product: {
      id: string;
      handle: string;
      title: string;
      variants: { nodes: { id: string; sku: string; price: string }[] };
    } | null;
    userErrors: { field?: string[] | null; message: string }[];
  };
};

export async function upsertProduct(product: CatalogProduct): Promise<{ id: string; variantId: string }> {
  const data = await adminGraphQL<ProductSetResult>(PRODUCT_SET, {
    identifier: { handle: product.handle },
    input: {
      handle: product.handle,
      title: product.title,
      descriptionHtml: `<p>${product.description}</p>`,
      status: "ACTIVE",
      vendor: "Remember Me Gems",
      productType: product.kind === "stone" ? "Memorial Gemstone" : "Add-on",
      tags: product.kind === "stone" ? ["rmg", "stone"] : ["rmg", "addon"],
      // productSet requires every variant to name its option values, even for
      // a product with no real options — so each product gets Shopify's
      // conventional single "Title / Default Title" option. Omitting this is
      // rejected with "variants.0.optionValues (Expected value to not be
      // null)", which reads like a null-handling bug rather than a missing
      // required field.
      productOptions: [{ name: "Title", position: 1, values: [{ name: "Default Title" }] }],
      variants: [
        {
          optionValues: [{ optionName: "Title", name: "Default Title" }],
          sku: product.sku,
          price: product.price.toFixed(2),
          // Every gem is made to order, so Shopify must never gate a sale on a
          // stock count — Notion remains the real inventory source of truth
          // and is decremented when the order is written.
          inventoryItem: { tracked: false, requiresShipping: product.kind === "stone" },
        },
      ],
    },
  });

  assertNoUserErrors(data.productSet.userErrors, `productSet(${product.handle})`);
  const p = data.productSet.product;
  if (!p) throw new Error(`productSet(${product.handle}) returned no product`);
  const variantId = p.variants.nodes[0]?.id;
  if (!variantId) throw new Error(`productSet(${product.handle}) returned no variant`);
  return { id: p.id, variantId };
}

// A product that isn't published to the sales channel the Storefront token
// belongs to is invisible to the Storefront API — carts would fail with an
// unhelpful "product not found" even though the product plainly exists in
// the admin. This is the single most common headless catalog trap.
const PUBLICATIONS = /* GraphQL */ `
  query RmgPublications {
    publications(first: 25, catalogType: APP) {
      nodes {
        id
        name
      }
    }
  }
`;

export async function listPublications(): Promise<{ id: string; name: string }[]> {
  const data = await adminGraphQL<{ publications: { nodes: { id: string; name: string }[] } }>(PUBLICATIONS);
  return data.publications.nodes;
}

const PUBLISH = /* GraphQL */ `
  mutation RmgPublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

// Every product this sync owns is tagged "rmg", so retired stones can be found
// again later without keeping a separate ledger of what we created.
const MANAGED_PRODUCTS = /* GraphQL */ `
  query RmgManagedProducts($cursor: String) {
    products(first: 100, after: $cursor, query: "tag:rmg") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        status
        variants(first: 1) {
          nodes {
            sku
          }
        }
      }
    }
  }
`;

export type ManagedProduct = { id: string; handle: string; title: string; status: string; sku: string };

export async function listManagedProducts(): Promise<ManagedProduct[]> {
  const out: ManagedProduct[] = [];
  let cursor: string | null = null;
  do {
    const data: {
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: { id: string; handle: string; title: string; status: string; variants: { nodes: { sku: string }[] } }[];
      };
    } = await adminGraphQL(MANAGED_PRODUCTS, { cursor });
    for (const n of data.products.nodes) {
      out.push({ id: n.id, handle: n.handle, title: n.title, status: n.status, sku: n.variants.nodes[0]?.sku ?? "" });
    }
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

const ARCHIVE_PRODUCT = /* GraphQL */ `
  mutation RmgArchiveProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Retiring a stone in Notion has to retire it in Shopify too, or the product
// stays ACTIVE, stays published, and — with inventory tracking off — stays
// purchasable by anyone holding the old URL or variant ID. The Studio not
// offering it is not the same as Shopify refusing to sell it.
//
// ARCHIVED rather than deleted on purpose: archiving makes it unbuyable and
// pulls it from every channel while keeping it attached to the orders that
// already reference it. Deleting orphans those historical line items.
export async function archiveProduct(productId: string): Promise<void> {
  const data = await adminGraphQL<{
    productUpdate: { userErrors: { field?: string[] | null; message: string }[] };
  }>(ARCHIVE_PRODUCT, { input: { id: productId, status: "ARCHIVED" } });
  assertNoUserErrors(data.productUpdate.userErrors, `archiveProduct(${productId})`);
}

export async function publishProduct(productId: string, publicationIds: string[]): Promise<void> {
  if (publicationIds.length === 0) return;
  const data = await adminGraphQL<{ publishablePublish: { userErrors: { field?: string[] | null; message: string }[] } }>(
    PUBLISH,
    { id: productId, input: publicationIds.map((publicationId) => ({ publicationId })) }
  );
  assertNoUserErrors(data.publishablePublish.userErrors, `publishablePublish(${productId})`);
}
