import { NOTION_DB } from "./config";
import { createPage, getPage, updatePage, hasNotionToken, num } from "./client";
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
};

const LETTERING_STYLE_TO_ORDER_FIELD: Record<string, string> = {
  "Flowing Script": "Elegant Script",
  Monument: "Bold Sans",
};

function generateOrderNumber() {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RMG-${stamp}-${rand}`;
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

export async function createOrder(input: OrderInput): Promise<{ orderNumber: string; pageId: string | null }> {
  const orderNumber = generateOrderNumber();

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
    "Ash Inlay Color": { select: { name: INLAY_COLOR_TO_ORDER_FIELD[input.inlayColor] ?? input.inlayColor } },
    "Engraving Font": { select: { name: LETTERING_STYLE_TO_ORDER_FIELD[input.letteringStyle] ?? input.letteringStyle } },
    "Back Engraving": { rich_text: [{ text: { content: input.initials } }] },
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

  // Per global_beta_mode's own Notion Notes: "disable inventory decrement
  // during test orders" — siblings/testers clicking through the Studio
  // while beta mode is on shouldn't move real stone counts.
  if (!input.betaMode) {
    await decrementStoneInventory(input.stoneId);
  }

  return { orderNumber, pageId: page.id };
}
