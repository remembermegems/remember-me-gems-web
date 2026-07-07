import { NextRequest, NextResponse } from "next/server";
import { getStones } from "@/lib/notion/stones";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import { calculatePrice } from "@/lib/studio/pricing";
import { hasSquareCredentials, createSquareCheckoutLink } from "@/lib/square/client";
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
  for (const gem of gems) {
    const stone = stones.find((s) => s.name === gem.stoneName);
    if (!stone) {
      return NextResponse.json({ error: `Unknown stone: ${gem.stoneName}` }, { status: 400 });
    }
    // Recomputed server-side from the live catalog — never trust a
    // client-sent total for the actual amount charged.
    const { basePrice, addOns, total } = calculatePrice({
      stone,
      shape: gem.shapeName as ShapeName,
      carryType: (gem.carryType as OrderInput["carryType"]) ?? null,
      betaMode,
      customSymbolAddOn: false,
    });

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

  if (!hasSquareCredentials()) {
    // No Square sandbox credentials configured yet — skip straight to the
    // Notion order write so the rest of the pipeline is still testable.
    const redirectUrl = `${siteUrl}/create-your-remember-me-gem/order-confirmed?mock=1&data=${encodedOrder}`;
    return NextResponse.json({ checkoutUrl: redirectUrl });
  }

  try {
    const redirectUrl = `${siteUrl}/create-your-remember-me-gem/order-confirmed?data=${encodedOrder}`;
    const { checkoutUrl } = await createSquareCheckoutLink({
      referenceId: sharedOrderId,
      lineItems: orders.map((o) => ({
        name: `Remember Me Gem — ${o.stoneName} ${o.shapeName}`,
        amountCents: Math.round(o.totalPrice * 100),
      })),
      redirectUrl,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[checkout] Square error", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }
}
