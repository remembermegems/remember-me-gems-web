import { NOTION_DB } from "./config";
import { createPage, getPage, updatePage, hasNotionToken, num, text, queryAllRows } from "./client";
import { getConfiguratorCopy, copyText } from "./configuratorCopy";
import type { OrderInput } from "./types";

// The Studio's customer-facing inlay color label ("White") and the two Notion
// DBs disagree on naming ("Metallic White" in Orders & Production) — map explicitly
// rather than writing a value the select field will silently reject.
const INLAY_COLOR_TO_ORDER_FIELD: Record<string, string> = {
  Natural: "Natural",
  Gold: "Gold",
  Silver: "Silver",
  White: "Metallic White",
  Turquoise: "Turquoise",
  "Metallic Black": "Metallic Black",
  Copper: "Copper",
};

const LETTERING_STYLE_TO_ORDER_FIELD: Record<string, string> = {
  "Flowing Script": "Elegant Script",
  Monument: "Bold Sans",
};

// RMG-YYMMDD-NNxx — e.g. "RMG-260918-01K3" for the first order on 2026-09-18.
// Replaces a full timestamp+random string (2026-09-25, Anthony's call): too
// long to be useful at a glance. NN is that day's running order count (a real
// Notion lookup, not derived locally) so the number itself tells you both the
// date and roughly how many orders came in that day; xx is a 2-character
// random tie-breaker, not a uniqueness guarantee — the real unique join key
// across an order's gems is still the separate "Order ID" field. A collision
// on NNxx would only ever produce two human-readable labels that look alike,
// never actual data loss, which is an acceptable tradeoff for a low-volume
// family business over adding real locking for this.
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  let seq = 1;
  if (hasNotionToken()) {
    try {
      const todayIso = now.toISOString().slice(0, 10);
      const rows = await queryAllRows(NOTION_DB.orders, {
        property: "Date Ordered",
        date: { equals: todayIso },
      });
      seq = rows.length + 1;
    } catch (err) {
      // Falls back to "01" — a wrong count still produces a valid-looking,
      // sortable order number, just not a perfectly accurate daily count.
      console.warn("[orders] Failed to count today's orders for the sequence number, defaulting to 1", err);
    }
  }

  const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `RMG-${dateStamp}-${String(seq).padStart(2, "0")}${rand}`;
}

// Best-effort — a failure here shouldn't break order confirmation for the
// customer, since the order itself has already been written to Notion.
// Stones with no quantity tracked at all (null) are left untouched rather
// than writing a made-up number.
async function decrementStoneInventory(stoneId: string) {
  try {
    const page = await getPage(stoneId);
    const currentQty = num(page, "Original Quantity");
    if (currentQty == null) return;
    await updatePage(stoneId, { "Original Quantity": { number: Math.max(currentQty - 1, 0) } });
  } catch (err) {
    console.warn("[orders] Failed to decrement stone inventory for", stoneId, err);
  }
}

// Separate from `global_beta_mode`, which controls price display only. This
// flag is the one honest answer to "did a real stone just get used" —
// confirmed with Anthony 2026-07-29 after the two got conflated: beta pricing
// is now the real pricing shown to real family orders, so it can no longer
// double as "this is just a test, don't touch inventory."
//
// Defaults to false (no decrement) when the row doesn't exist yet or Notion
// is unreachable — the safe direction to fail in is under-decrementing
// (fixable with a manual count correction) rather than silently draining
// real stock during testing.
async function liveOrdersEnabled(): Promise<boolean> {
  const copy = await getConfiguratorCopy();
  return copyText(copy, "global_live_orders", "false") === "true";
}

// Idempotency guard for the orders/paid webhook. Shopify retries any delivery
// that doesn't 200 quickly and can send the same event more than once, so the
// only thing standing between a retry and duplicate production rows is asking
// Notion whether this order ID is already there.
export async function findOrdersByOrderId(orderId: string): Promise<{ id: string; orderNumber: string }[]> {
  if (!hasNotionToken()) return [];
  const rows = await queryAllRows(NOTION_DB.orders, {
    property: "Order ID",
    rich_text: { equals: orderId },
  });
  return rows.map((r) => ({ id: r.id, orderNumber: text(r, "Order Number") }));
}

export async function createOrder(input: OrderInput): Promise<{ orderNumber: string; pageId: string | null }> {
  const orderNumber = await generateOrderNumber();

  if (!hasNotionToken()) {
    console.warn("[orders] NOTION_TOKEN not set — order not written to Notion:", orderNumber, input);
    return { orderNumber, pageId: null };
  }

  const inMemoryOf = [
    `${input.firstName} ${input.lastName}`.trim(),
    input.birthYear || input.deathYear ? `(${input.birthYear ?? "?"}–${input.deathYear ?? "?"})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const page = await createPage(NOTION_DB.orders, {
    "Order Number": { title: [{ text: { content: orderNumber } }] },
    "Order ID": { rich_text: [{ text: { content: input.orderId } }] },
    // Everything else in "kit shipped / ash arrived / gem shipped" is a
    // manual, physical-fulfillment step Anthony tracks by hand — only the
    // order's own creation date is known at write time, so only this one
    // gets set by code (his instruction 2026-07-07).
    "Date Ordered": { date: { start: new Date().toISOString().slice(0, 10) } },
    "First Name": { rich_text: [{ text: { content: input.firstName } }] },
    "Last Name": { rich_text: [{ text: { content: input.lastName } }] },
    "In Memory Of": { rich_text: [{ text: { content: inMemoryOf } }] },
    "Birth Year": { rich_text: [{ text: { content: input.birthYear ?? "" } }] },
    "Death Year": { rich_text: [{ text: { content: input.deathYear ?? "" } }] },
    Stone: { rich_text: [{ text: { content: input.stoneName } }] },
    Shape: { rich_text: [{ text: { content: input.shapeName } }] },
    Symbol: { rich_text: [{ text: { content: input.symbolName } }] },
    // Real gap found 2026-08-04: OrderInput carried carryType all along, but
    // no property on this database ever received it, and the field itself
    // didn't exist yet either. Matters for production, not just display —
    // Wear It/Hang It need a drilled hole, Carry It (the touchstone) doesn't,
    // same question for shapes being added later like the dog tag.
    ...(input.carryType ? { "Carry Type": { select: { name: input.carryType } } } : {}),
    "Ash Inlay Color": { select: { name: INLAY_COLOR_TO_ORDER_FIELD[input.inlayColor] ?? input.inlayColor } },
    "Engraving Font": { select: { name: LETTERING_STYLE_TO_ORDER_FIELD[input.letteringStyle] ?? input.letteringStyle } },
    // A blank field was ambiguous between "customer declined initials" and
    // "something went wrong" (real incident, 2026-08-02: 4 live orders with
    // blank initials, no way to tell which from the data alone). Writing an
    // explicit marker settles it at a glance, and reads clearly to whoever's
    // actually doing the engraving — not just letters, so it can't be
    // mistaken for something to engrave.
    "Back Engraving": {
      rich_text: [{ text: { content: input.declinedInitials ? "(No initials — customer declined)" : input.initials } }],
    },
    "Add-ons": { rich_text: [{ text: { content: input.addOns.join(", ") } }] },
    "Base Price": { number: input.basePrice },
    "Total Price": { number: input.totalPrice },
    Channel: { select: { name: input.channel } },
    Status: { select: { name: "New Order" } },
    "Custom Order": { checkbox: false },
    ...(input.customerName ? { "Customer Name": { rich_text: [{ text: { content: input.customerName } }] } } : {}),
    ...(input.customerEmail ? { "Customer Email": { email: input.customerEmail } } : {}),
    ...(input.customerPhone ? { "Customer Phone": { phone_number: input.customerPhone } } : {}),
    ...(input.contactPreference ? { "Contact Preference": { select: { name: input.contactPreference } } } : {}),
    ...(input.streetAddress ? { "Street Address": { rich_text: [{ text: { content: input.streetAddress } }] } } : {}),
    ...(input.city ? { City: { rich_text: [{ text: { content: input.city } }] } } : {}),
    ...(input.state ? { State: { rich_text: [{ text: { content: input.state } }] } } : {}),
    ...(input.zip ? { ZIP: { rich_text: [{ text: { content: input.zip } }] } } : {}),
  });

  // See liveOrdersEnabled() above — deliberately independent of beta pricing.
  if (await liveOrdersEnabled()) {
    await decrementStoneInventory(input.stoneId);
  }

  return { orderNumber, pageId: page.id };
}
