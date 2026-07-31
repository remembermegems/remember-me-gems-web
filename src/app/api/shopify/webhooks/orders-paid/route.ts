import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { shopifyClientSecret, SHOPIFY_SHOP_DOMAIN } from "@/lib/shopify/config";
import { createOrder, findOrdersByOrderId } from "@/lib/notion/orders";
import type { OrderInput, ShapeName, InlayColor, LetteringStyle, CarryType } from "@/lib/notion/types";

export const runtime = "nodejs";

// Shopify signs webhook bodies with the app's client secret. Verifying against
// the RAW body is mandatory — re-serializing the parsed JSON changes the bytes
// and the signature will never match.
function verifyWebhook(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

type ShopifyLineItem = {
  sku?: string | null;
  quantity: number;
  properties?: { name: string; value: string }[] | null;
};

type ShopifyOrder = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  note_attributes?: { name: string; value: string }[] | null;
  line_items: ShopifyLineItem[];
  shipping_address?: {
    name?: string | null;
    address1?: string | null;
    city?: string | null;
    province_code?: string | null;
    zip?: string | null;
    phone?: string | null;
  } | null;
};

function propMap(item: ShopifyLineItem): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of item.properties ?? []) out[p.name] = p.value;
  return out;
}

// Rebuilds one OrderInput per gem line from the hidden "_"-prefixed line-item
// properties written at cart creation. Add-on lines carry no "_stone_id" and
// are skipped — their cost is already folded into the gem's _total_price.
function ordersFromShopify(order: ShopifyOrder, sharedOrderId: string): OrderInput[] {
  const ship = order.shipping_address ?? {};
  const out: OrderInput[] = [];

  for (const item of order.line_items) {
    const p = propMap(item);
    if (!p._stone_id) continue;

    // A gem line with quantity > 1 is N identical physical pieces, each of
    // which needs its own production row — same reasoning as the cart
    // expansion on the way in.
    for (let i = 0; i < Math.max(1, item.quantity); i += 1) {
      out.push({
        firstName: p._first_name ?? "",
        lastName: p._last_name ?? "",
        birthYear: p._birth_year || undefined,
        deathYear: p._death_year || undefined,
        stoneId: p._stone_id,
        stoneName: p._stone_name ?? "",
        shapeName: (p._shape_name ?? "") as ShapeName,
        carryType: (p._carry_type || undefined) as CarryType | undefined,
        symbolName: p._symbol_name ?? "",
        inlayColor: (p._inlay_color ?? "Natural") as InlayColor,
        letteringStyle: (p._lettering_style ?? "Monument") as LetteringStyle,
        initials: p._initials ?? "",
        addOns: p._add_ons ? p._add_ons.split(", ").filter(Boolean) : [],
        basePrice: Number(p._base_price ?? 0),
        totalPrice: Number(p._total_price ?? 0),
        channel: "Web",
        orderId: sharedOrderId,
        betaMode: p._beta_mode === "true",
        // Shipping details come from Shopify's own checkout, not from the
        // address we collected earlier — Shopify's is what the customer
        // actually confirmed and paid against, and it's been validated.
        customerName: ship.name ?? undefined,
        customerEmail: order.email ?? undefined,
        customerPhone: ship.phone ?? order.phone ?? undefined,
        streetAddress: ship.address1 ?? undefined,
        city: ship.city ?? undefined,
        state: ship.province_code ?? undefined,
        zip: ship.zip ?? undefined,
      });
    }
  }

  return out;
}

export async function POST(req: NextRequest) {
  const secret = shopifyClientSecret();
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyWebhook(raw, signature, secret)) {
    // Never 500 here — an unverified body is a rejected request, not an error
    // on our side, and Shopify shouldn't be told to retry it.
    console.warn("[shopify webhook] rejected: bad HMAC");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const shopDomain = req.headers.get("x-shopify-shop-domain");
  if (shopDomain && shopDomain !== SHOPIFY_SHOP_DOMAIN) {
    console.warn("[shopify webhook] rejected: unexpected shop", shopDomain);
    return NextResponse.json({ error: "unexpected shop" }, { status: 401 });
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const sharedOrderId =
    order.note_attributes?.find((a) => a.name === "RMG Order ID")?.value ?? `SHOPIFY-${order.id}`;

  try {
    // Shopify retries a webhook that doesn't 200 within 5 seconds, and can
    // deliver the same event more than once regardless. Writing blind would
    // put duplicate production rows in front of Anthony for a single order.
    const existing = await findOrdersByOrderId(sharedOrderId);
    if (existing.length > 0) {
      console.log(`[shopify webhook] ${sharedOrderId} already recorded (${existing.length} rows) — skipping`);
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const orders = ordersFromShopify(order, sharedOrderId);
    if (orders.length === 0) {
      console.warn(`[shopify webhook] ${order.name} had no gem line items — nothing written`);
      return NextResponse.json({ ok: true, written: 0 });
    }

    for (const o of orders) await createOrder(o);
    console.log(`[shopify webhook] recorded ${orders.length} gem(s) for ${sharedOrderId} (${order.name})`);
    return NextResponse.json({ ok: true, written: orders.length });
  } catch (err) {
    // A 500 makes Shopify retry, which is what we want for a transient Notion
    // failure — better a retry than a paid order that never reaches production.
    console.error("[shopify webhook] failed to record order", err);
    return NextResponse.json({ error: "failed to record" }, { status: 500 });
  }
}
