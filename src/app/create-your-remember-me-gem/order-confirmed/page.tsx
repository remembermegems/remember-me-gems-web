import { createOrder, findOrdersByOrderId } from "@/lib/notion/orders";
import { getStones } from "@/lib/notion/stones";
import { getSymbols } from "@/lib/notion/symbols";
import { CtaLink } from "@/components/CtaButton";
import { GemCanvas } from "@/components/studio/GemCanvas";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import type { OrderInput, Stone, Symbol } from "@/lib/notion/types";
import { PurchaseEvent } from "@/components/PurchaseEvent";

function GemSummary({
  order,
  stones,
  symbols,
  isComplimentary,
}: {
  order: OrderInput;
  stones: Stone[];
  symbols: Symbol[];
  isComplimentary: boolean;
}) {
  const stone = stones.find((s) => s.id === order.stoneId);
  const symbol = symbols.find((s) => s.name === order.symbolName);
  const stoneColor = stone ? stoneSwatchColor(stone.name, stone.colorFamily) : "#AFC4D6";
  const years = order.birthYear || order.deathYear ? ` (${order.birthYear || "?"}–${order.deathYear || "?"})` : "";

  const summary: { label: string; value: string }[] = [
    { label: "Gemstone", value: order.stoneName },
    { label: "Shape", value: order.shapeName },
    { label: "How you'll carry it", value: order.carryType ?? "—" },
    { label: "Symbol", value: order.symbolName || "—" },
    { label: "Inlay color", value: order.inlayColor },
    { label: "Lettering style", value: order.letteringStyle },
    { label: "Initials", value: order.initials || "—" },
  ];

  return (
    <div className="mb-10">
      <div className="flex justify-center gap-8 my-10 flex-wrap">
        <div className="text-center">
          <GemCanvas
            shape={order.shapeName}
            stoneColor={stoneColor}
            stoneImageUrl={stone?.stoneImageUrl}
            inlayColor={order.inlayColor}
            symbol={symbol ? { name: symbol.name, path: symbol.svgPathData, viewBox: symbol.viewBox } : null}
            side="front"
            maxWidth={160}
            stoneName={stone?.name}
          />
          <p className="text-xs text-cocoa/50 mt-2">Front</p>
        </div>
        <div className="text-center">
          <GemCanvas
            shape={order.shapeName}
            stoneColor={stoneColor}
            stoneImageUrl={stone?.stoneImageUrl}
            inlayColor={order.inlayColor}
            side="back"
            initials={order.initials}
            letteringStyle={order.letteringStyle}
            maxWidth={160}
            stoneName={stone?.name}
          />
          <p className="text-xs text-cocoa/50 mt-2">Back</p>
        </div>
      </div>

      <p className="font-body text-cocoa/80 mb-6 text-center">
        In memory of {order.firstName} {order.lastName}
        {years}
      </p>

      <div className="rounded-2xl bg-cream divide-y divide-cocoa/10 mb-6 text-left">
        {summary.map((s) => (
          <div key={s.label} className="px-5 py-3">
            <p className="text-xs uppercase tracking-wide text-cocoa/50">{s.label}</p>
            <p className="font-body text-cocoa">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Shows the piece's real value for context, but never implies it was
          actually charged — a $495 line under "no payment needed" would read
          as a mistake to a family member, not a gift. */}
      <p className="font-heading text-2xl text-cocoa text-center">
        {isComplimentary ? (
          <>
            <span className="line-through text-cocoa/40 text-lg mr-2">${order.totalPrice}</span>
            Complimentary
          </>
        ) : (
          `$${order.totalPrice}`
        )}
      </p>
    </div>
  );
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; comp?: string }>;
}) {
  const { data, comp } = await searchParams;

  if (!data) {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
        <h1 className="font-heading text-3xl text-cocoa mb-4">Something went wrong</h1>
        <p className="text-cocoa/70 mb-6">We couldn&rsquo;t find your order details. Please reach out via Special Requests and we&rsquo;ll sort it out together.</p>
        <CtaLink href="/special-requests">Contact Us</CtaLink>
      </div>
    );
  }

  const orders = JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as OrderInput[];

  // Idempotency guard (added 2026-08-04, real incident): this page is a real
  // GET-able URL, not a one-shot action — reloading it, revisiting it from
  // browser history, reopening a bookmarked/shared link, or a messaging app
  // auto-previewing a shared link all load it again. Without this, every one
  // of those re-writes the same order to Notion a second time. The Shopify
  // webhook path already had this exact guard (findOrdersByOrderId); this
  // complimentary/no-payment path — the one actually in use right now — never
  // got it. Confirmed real duplicates in production: same Order ID written
  // minutes to over an hour apart.
  const sharedOrderId = orders[0]?.orderId;
  const existingOrders = sharedOrderId ? await findOrdersByOrderId(sharedOrderId) : [];
  const alreadyRecorded = existingOrders.length > 0;

  const [orderResults, stones, symbols] = await Promise.all([
    alreadyRecorded
      ? Promise.resolve(existingOrders.map((e) => ({ orderNumber: e.orderNumber, pageId: e.id })))
      : Promise.all(orders.map((order) => createOrder(order))),
    getStones(),
    getSymbols(),
  ]);

  const grandTotal = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const firstOrder = orders[0];

  const isComplimentary = comp === "1";

  return (
    <div className="max-w-[600px] mx-auto px-6 py-24 text-center">
      {/* GA4 standard purchase event (#29) — closes the funnel that
          studio_step_view / add_to_cart / begin_checkout open. Suppressed for
          complimentary orders: no money changed hands, so a "purchase" event
          at sticker price would overstate revenue once real orders are mixed
          in with family/demo pieces in the same GA4 property. */}
      {/* Also gated on !alreadyRecorded — a reload of this same page must not
          fire a second "purchase" event for the same order, or GA4's revenue
          numbers double-count every time this page gets revisited. */}
      {!isComplimentary && !alreadyRecorded && (
        <PurchaseEvent
          transactionId={firstOrder.orderId}
          value={grandTotal}
          items={orders.map((o) => ({
            item_id: o.stoneId,
            item_name: o.stoneName,
            item_category: o.shapeName,
            price: o.totalPrice,
            quantity: 1,
          }))}
        />
      )}
      <h1 className="font-heading text-3xl text-cocoa mb-4" style={{ color: "#4E3F35" }}>
        Thank you.
      </h1>
      <p className="text-cocoa/70 mb-2">
        {orders.length === 1
          ? `${firstOrder.firstName}'s Remember Me Gem is on its way to being made — order ${orderResults[0].orderNumber}.`
          : `Your ${orders.length} Remember Me Gems are on their way to being made — order ${firstOrder.orderId}.`}
      </p>
      {isComplimentary && (
        <p className="text-gold text-sm mb-6">
          This one&rsquo;s a gift from our family to yours — no payment needed.
        </p>
      )}

      {orders.map((order, i) => (
        <GemSummary key={i} order={order} stones={stones} symbols={symbols} isComplimentary={isComplimentary} />
      ))}

      {orders.length > 1 && (
        <p className="font-heading text-3xl text-cocoa mb-8">
          {isComplimentary ? "Complimentary" : `Total: $${grandTotal}`}
        </p>
      )}

      <p className="text-cocoa/60 mb-10">We&rsquo;ll be in touch with next steps for sending in the ashes.</p>
      <CtaLink href="/create-your-remember-me-gem">Start a New Gem</CtaLink>
    </div>
  );
}
