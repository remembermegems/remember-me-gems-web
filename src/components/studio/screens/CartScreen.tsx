"use client";

import { useRef, useState } from "react";
import { useStudioStore, cartQuantity, cartLineTotal } from "@/store/studio";
import { GemCanvas } from "../GemCanvas";
import { SectionDivider } from "@/components/SectionDivider";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";
import { trackEvent } from "@/lib/analytics";

type AddressForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactPreference: "Email" | "Phone";
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
};

const EMPTY_ADDRESS: AddressForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  contactPreference: "Email",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
};

export function CartScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Anthony's call 2026-07-06 (Option 2 — build it ourselves rather than
  // lean on Square's hosted checkout to ask for it): after "Start checkout"
  // is pressed, gate on this address form before actually creating the
  // Square payment link, since we need a real mailing address to ship the
  // finished gem and nothing upstream in the Studio ever asked for one.
  const [collectingAddress, setCollectingAddress] = useState(false);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);

  // Gem-render capture (punch list #31) — one PNG per distinct cart row,
  // captured in the background as soon as the cart renders so it's ready by
  // the time "Start checkout" is pressed, without making the customer wait
  // on it. Keyed by cart index (not by physical-piece count) since identical
  // quantity copies share one render — expanded out to match `gems` only
  // when building the checkout request body below.
  const renderCaptures = useRef<Record<number, { front?: string; back?: string }>>({});
  const captureCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const captureCanvasRefsBack = useRef<Record<number, HTMLCanvasElement | null>>({});

  const grandTotal = store.cart.reduce((sum, g) => sum + cartLineTotal(g), 0);

  const addressValid =
    address.customerName.trim() &&
    address.customerEmail.trim() &&
    address.streetAddress.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.zip.trim();

  async function handleStartCheckout() {
    setSubmitting(true);
    setError(null);
    // GA4 standard ecommerce event (#29) — fired before the request so it's
    // recorded even if checkout creation then fails, which is exactly the
    // drop-off Anthony wants visibility into.
    trackEvent("begin_checkout", {
      currency: "USD",
      value: grandTotal,
      items: store.cart.map((g) => ({
        item_id: g.stone.id,
        item_name: g.stone.name,
        item_category: g.shape,
        item_variant: g.carryType ?? "",
        price: g.totalPrice,
        quantity: cartQuantity(g),
      })),
    });
    try {
      // Give any still-rendering capture canvas a few seconds to finish, so a
      // quick click-through doesn't send an order with no gem images.
      for (let waited = 0; waited < 4000; waited += 250) {
        const allCaptured = store.cart.every((_, i) => renderCaptures.current[i]?.front && renderCaptures.current[i]?.back);
        if (allCaptured) break;
        await new Promise((r) => setTimeout(r, 250));
      }
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // A quantity of 3 is sent as three separate gems, not one line with
          // a count: each is a physically separate handmade piece that needs
          // its own production row and its own inventory decrement, and the
          // pricing/inventory logic downstream already handles one-gem-per-
          // entry correctly.
          gems: store.cart.flatMap((g) =>
            Array.from({ length: cartQuantity(g) }, () => ({
              firstName: g.firstName,
              lastName: g.lastName,
              birthYear: g.birthYear,
              deathYear: g.deathYear,
              stoneName: g.stone.name,
              shapeName: g.shape,
              carryType: g.carryType,
              symbolName: g.symbol?.name ?? "",
              inlayColor: g.inlayColor,
              letteringStyle: g.letteringStyle,
              initials: g.initials,
              declinedInitials: g.declinedInitials,
            }))
          ),
          customer: address,
          militaryDiscount: store.militaryDiscount,
          // Expanded to line up 1:1 with `gems` above — every copy of a
          // repeated quantity gets the same captured renders, since they're
          // identical pieces. Missing/uncaptured entries become undefined,
          // which the API route already treats as "skip this one."
          gemRendersFront: store.cart.flatMap((g, i) =>
            Array.from({ length: cartQuantity(g) }, () => renderCaptures.current[i]?.front)
          ),
          gemRendersBack: store.cart.flatMap((g, i) =>
            Array.from({ length: cartQuantity(g) }, () => renderCaptures.current[i]?.back)
          ),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { checkoutUrl } = await res.json();
      store.clearCart();
      window.location.href = checkoutUrl;
    } catch {
      setError("Something went wrong starting checkout. Please try again, or reach out via Special Requests.");
      setSubmitting(false);
    }
  }

  // Hidden, capture-only canvases (punch list #31). Defined once and rendered
  // in EVERY view below: they used to live only in the cart-list view, so
  // opening the address form unmounted them, and any render not captured by
  // that moment was lost for good (the order then had no gem images in its
  // confirmation email — seen on the beta site, 2026-09-23).
  const captureCanvases = (
  <div aria-hidden style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", left: -9999, top: -9999 }}>
    {store.cart.map((g, i) => (
      <GemCanvas
        key={i}
        shape={g.shape}
        stoneColor={stoneSwatchColor(g.stone.name, g.stone.colorFamily)}
        stoneImageUrl={g.stone.stoneImageUrl ? `/api/studio/image-proxy?url=${encodeURIComponent(g.stone.stoneImageUrl)}` : null}
        inlayColor={g.inlayColor}
        symbol={g.symbol ? { name: g.symbol.name, path: g.symbol.svgPathData, viewBox: g.symbol.viewBox } : null}
        side="front"
        maxWidth={480}
        canvasRef={{
          get current() {
            return captureCanvasRefs.current[i] ?? null;
          },
          set current(el: HTMLCanvasElement | null) {
            captureCanvasRefs.current[i] = el;
          },
        }}
        onRender={() => {
          const canvas = captureCanvasRefs.current[i];
          if (!canvas || renderCaptures.current[i]?.front) return;
          try {
            renderCaptures.current[i] = { ...renderCaptures.current[i], front: canvas.toDataURL("image/png") };
          } catch (err) {
            console.warn("[CartScreen] gem render capture failed", err);
          }
        }}
      />
    ))}
    {store.cart.map((g, i) => (
      <GemCanvas
        key={`back-${i}`}
        shape={g.shape}
        stoneColor={stoneSwatchColor(g.stone.name, g.stone.colorFamily)}
        stoneImageUrl={g.stone.stoneImageUrl ? `/api/studio/image-proxy?url=${encodeURIComponent(g.stone.stoneImageUrl)}` : null}
        inlayColor={g.inlayColor}
        initials={g.initials}
        letteringStyle={g.letteringStyle}
        side="back"
        maxWidth={480}
        canvasRef={{
          get current() {
            return captureCanvasRefsBack.current[i] ?? null;
          },
          set current(el: HTMLCanvasElement | null) {
            captureCanvasRefsBack.current[i] = el;
          },
        }}
        onRender={() => {
          const canvas = captureCanvasRefsBack.current[i];
          if (!canvas || renderCaptures.current[i]?.back) return;
          try {
            renderCaptures.current[i] = { ...renderCaptures.current[i], back: canvas.toDataURL("image/png") };
          } catch (err) {
            console.warn("[CartScreen] gem back-render capture failed", err);
          }
        }}
      />
    ))}
  </div>
  );

  // Once checkout starts, clearCart() wipes the cart that this screen reads
  // from — but the redirect (a real page navigation, sometimes to an external
  // Square page) isn't instant. Render a simple redirect message instead of
  // letting the list/total flash down to zero while that's in flight.
  if (submitting) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <p className="font-body text-cocoa/70">Taking you to checkout…</p>
      </div>
    );
  }

  if (collectingAddress) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-16">
        {captureCanvases}
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
            {copyText(copy, "cart_address_headline", "Where should we send it?")}
          </h2>
          <p className="font-body text-cocoa/60">
            {copyText(copy, "cart_address_subtitle", "We'll need this to ship your Remember Me Gem.")}
          </p>
          <SectionDivider className="mt-4" />
        </div>

        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="Full name"
            value={address.customerName}
            onChange={(e) => setAddress({ ...address, customerName: e.target.value })}
            className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Email"
              value={address.customerEmail}
              onChange={(e) => setAddress({ ...address, customerEmail: e.target.value })}
              className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={address.customerPhone}
              onChange={(e) => setAddress({ ...address, customerPhone: e.target.value })}
              className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
            />
          </div>
          <input
            type="text"
            placeholder="Street address"
            value={address.streetAddress}
            onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
            className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
            />
            <input
              type="text"
              placeholder="State"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
            />
            <input
              type="text"
              placeholder="ZIP"
              value={address.zip}
              onChange={(e) => setAddress({ ...address, zip: e.target.value })}
              className="w-full rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body text-cocoa placeholder:text-cocoa/40"
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cocoa/50 mb-2 text-center">Preferred contact method</p>
            <div className="flex justify-center gap-3">
              {(["Email", "Phone"] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => setAddress({ ...address, contactPreference: pref })}
                  className={`px-4 py-2 rounded-full text-sm border ${
                    address.contactPreference === pref
                      ? "bg-cocoa text-warm-white border-cocoa"
                      : "border-cocoa/20 text-cocoa/70"
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-center text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCollectingAddress(false)}
            className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa"
          >
            {copyText(copy, "global_back_btn", "Back")}
          </button>
          <button
            onClick={handleStartCheckout}
            disabled={!addressValid}
            className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa disabled:opacity-40 disabled:hover:bg-gold disabled:hover:text-warm-white"
          >
            {copyText(copy, "cart_address_continue_btn", "Continue to payment")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      {captureCanvases}

      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {store.cart.length === 0
            ? copyText(copy, "cart_headline_empty", "Your cart is empty")
            : copyText(copy, "cart_headline", "Added to Cart")}
        </h2>
        <p className="font-body text-cocoa/60">
          {store.cart.length === 0
            ? copyText(copy, "cart_subtitle_empty", "Your cart is empty. You can start a new gem whenever you're ready.")
            : store.cart.length === 1
              ? copyText(copy, "cart_subtitle_single", "Your gem is ready for checkout, or add another to the same order.")
              : copyText(copy, "cart_subtitle_multi", "{count} gems ready for checkout.").replace(
                  "{count}",
                  String(store.cart.length)
                )}
        </p>
        <SectionDivider className="mt-4" />
      </div>

      <div className="rounded-2xl bg-cream divide-y divide-cocoa/10 mb-8">
        {store.cart.map((g, i) => {
          const qty = cartQuantity(g);
          return (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="shrink-0">
                <GemCanvas
                  shape={g.shape}
                  stoneColor={stoneSwatchColor(g.stone.name, g.stone.colorFamily)}
                  stoneImageUrl={g.stone.stoneImageUrl}
                  inlayColor={g.inlayColor}
                  symbol={g.symbol ? { name: g.symbol.name, path: g.symbol.svgPathData, viewBox: g.symbol.viewBox } : null}
                  side="front"
                  stoneName={g.stone.name}
                  maxWidth={56}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-cocoa">
                  {g.stone.name} · {g.shape}
                </p>
                <p className="text-xs text-cocoa/50">
                  In memory of {g.firstName} {g.lastName}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => store.editCartItem(i)}
                    className="text-xs uppercase tracking-wide text-gold underline"
                  >
                    {copyText(copy, "cart_edit_btn", "Edit")}
                  </button>
                  <button
                    onClick={() => store.removeFromCart(i)}
                    className="text-xs uppercase tracking-wide text-cocoa/40 underline hover:text-cocoa/70"
                  >
                    {copyText(copy, "cart_remove_btn", "Remove")}
                  </button>
                </div>
              </div>

              {/* Quantity is true identical duplicates only — same design, same
                  engraving, same dedication. */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => store.setCartQuantity(i, qty - 1)}
                  disabled={qty <= 1}
                  aria-label={`Decrease quantity of ${g.stone.name}`}
                  className="w-7 h-7 rounded-full border border-cocoa/20 text-cocoa/70 leading-none disabled:opacity-30 disabled:cursor-not-allowed hover:border-cocoa/40"
                >
                  −
                </button>
                <span className="w-6 text-center font-body text-sm text-cocoa" aria-live="polite">
                  {qty}
                </span>
                <button
                  onClick={() => store.setCartQuantity(i, qty + 1)}
                  aria-label={`Increase quantity of ${g.stone.name}`}
                  className="w-7 h-7 rounded-full border border-cocoa/20 text-cocoa/70 leading-none hover:border-cocoa/40"
                >
                  +
                </button>
              </div>

              <div className="text-right shrink-0 w-20">
                <p className="font-body font-medium text-cocoa">${cartLineTotal(g)}</p>
                {qty > 1 && <p className="text-[11px] text-cocoa/40">${g.totalPrice} each</p>}
              </div>
            </div>
          );
        })}
      </div>

      {store.cart.length > 0 && (
        <>
          {/* Self-attested military/veteran discount (punch list #33) — one
              checkbox for the whole order, not per-gem. No verification
              vendor, matches the brand's trust-based tone rather than
              treating customers as suspects. Applies a real Shopify discount
              code (MILITARY10) at checkout creation — see createShopifyCheckout
              in lib/shopify/checkout.ts — but can't actually be exercised
              until #34 reconnects a live store (checkout is paused until
              then). */}
          <label className="flex items-center justify-center gap-2 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={store.militaryDiscount}
              onChange={(e) => store.setMilitaryDiscount(e.target.checked)}
              className="w-4 h-4 rounded border-cocoa/30 text-gold focus:ring-gold"
            />
            <span className="font-body text-sm text-cocoa/80">
              {copyText(
                copy,
                "cart_military_discount_label",
                "I am an active-duty or veteran service member (10% discount applied at checkout)"
              )}
            </span>
          </label>

          <div className="text-center mb-8">
            <p className="font-heading text-3xl text-cocoa">${grandTotal}</p>
          </div>
        </>
      )}

      {error && <p className="text-center text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex justify-center gap-4 flex-wrap">
        {store.cartViewReturnStep && (
          <button
            onClick={() => store.goToStep(store.cartViewReturnStep!)}
            className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa"
          >
            {copyText(copy, "cart_continue_configuring_btn", "Continue configuring")}
          </button>
        )}
        <button
          onClick={store.startAnotherGem}
          className="px-6 py-3 rounded-full font-body font-medium text-cocoa border border-cocoa/20 hover:border-cocoa/40"
        >
          {copyText(copy, "cart_add_another_btn", "Add another gem")}
        </button>
        {/* Removing the last gem empties the cart — there's nothing to check
            out, so the button goes rather than sitting there leading to a $0
            payment. "Add another gem" stays as the way forward. */}
        {store.cart.length > 0 && (
          <button
            onClick={() => setCollectingAddress(true)}
            className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa"
          >
            {copyText(copy, "cart_checkout_btn", "Start checkout")}
          </button>
        )}
      </div>
    </div>
  );
}
