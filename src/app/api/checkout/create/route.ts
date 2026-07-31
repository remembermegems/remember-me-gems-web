import { NextRequest, NextResponse } from "next/server";
import { getStones } from "@/lib/notion/stones";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import { calculatePrice, resolveAddOns, type ResolvedAddOn } from "@/lib/studio/pricing";
import { hasShopifyCheckout } from "@/lib/shopify/client";
import { createShopifyCheckout, ShopifyCatalogOutOfSyncError } from "@/lib/shopify/checkout";
import type { ShapeName, OrderInput } from "@/lib/notion/types";

type GemBody = {
  firstName: string;
  lastName: string;
  birthYear?: string;
  deathYear?: string;
  stoneName: string;
  shapeName: string;
  carryType?: string;
  symbolName?: string;
  inlayColor: string;
  letteringStyle: string;
  initials: string;
};

// The customer's own shipping info — one set per checkout, shared across
// every gem in the order (each gem still gets its own Notion row for
// production tracking, but they all carry the same shipping details).
type CustomerBody = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  contactPreference?: "Email" | "Phone";
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const gems: GemBody[] = body.gems;
  const customer: CustomerBody = body.customer ?? {};

  const [stones, copy] = await Promise.all([getStones(), getConfiguratorCopy()]);
  const betaMode = copyText(copy, "global_beta_mode", "true") === "true";

  const sharedOrderId = `RMG-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const orders: OrderInput[] = [];
  // Parallel to `orders` — the structured add-ons for each gem, so the Shopify
  // cart can add a real line item per upcharge instead of re-deriving them.
  const addOnsPerOrder: ResolvedAddOn[][] = [];
  for (const gem of gems) {
    const stone = stones.find((s) => s.name === gem.stoneName);
    if (!stone) {
      return NextResponse.json({ error: `Unknown stone: ${gem.stoneName}` }, { status: 400 });
    }
    // Recomputed server-side from the live catalog — never trust a
    // client-sent total for the actual amount charged.
    const priceInputs = {
      stone,
      shape: gem.shapeName as ShapeName,
      carryType: (gem.carryType as OrderInput["carryType"]) ?? null,
      customSymbolAddOn: false,
    };
    const { basePrice, addOns, total } = calculatePrice({ ...priceInputs, betaMode });
    addOnsPerOrder.push(resolveAddOns(priceInputs));

    orders.push({
      firstName: gem.firstName,
      lastName: gem.lastName,
      birthYear: gem.birthYear,
      deathYear: gem.deathYear,
      stoneId: stone.id,
      stoneName: stone.name,
      shapeName: gem.shapeName as ShapeName,
      carryType: gem.carryType as OrderInput["carryType"],
      symbolName: gem.symbolName ?? "",
      inlayColor: gem.inlayColor as OrderInput["inlayColor"],
      letteringStyle: gem.letteringStyle as OrderInput["letteringStyle"],
      initials: gem.initials,
      addOns,
      basePrice,
      totalPrice: total,
      channel: "Web",
      orderId: sharedOrderId,
      betaMode,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      customerPhone: customer.customerPhone,
      contactPreference: customer.contactPreference,
      streetAddress: customer.streetAddress,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const encodedOrder = Buffer.from(JSON.stringify(orders)).toString("base64url");

  if (!hasShopifyCheckout()) {
    // Either genuinely unconfigured (local dev with no tokens) or explicitly
    // paused via SHOPIFY_CHECKOUT_PAUSED (payments not verified yet, 2026-07-
    // 29) — either way, skip payment and write straight to Notion. While
    // paused this is real production behavior for complimentary family
    // orders, not a testing stub, hence "comp" rather than "mock" in the URL.
    const redirectUrl = `${siteUrl}/create-your-remember-me-gem/order-confirmed?comp=1&data=${encodedOrder}`;
    return NextResponse.json({ checkoutUrl: redirectUrl });
  }

  try {
    const { checkoutUrl } = await createShopifyCheckout({
      orders,
      addOnsPerOrder,
      orderId: sharedOrderId,
      customer,
    });
    // Note: unlike Square, there's no redirect back to this site after
    // payment — Shopify hosts the checkout and lands the customer on its own
    // order status page. The order is recorded from the orders/paid webhook
    // instead. See docs/studio-punch-list.md #25.
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    if (err instanceof ShopifyCatalogOutOfSyncError) {
      // Worth its own branch: this specific failure means Notion and Shopify
      // have drifted (usually a stone restocked above the reserve without a
      // sync run), and it's fixable in one command — a generic 502 would send
      // whoever sees it hunting in the wrong place.
      console.error("[checkout] Shopify catalog out of sync —", err.message);
      return NextResponse.json({ error: "Checkout unavailable for one of these gems", detail: err.message }, { status: 409 });
    }
    console.error("[checkout] Shopify error", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }
}
