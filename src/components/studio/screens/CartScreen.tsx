"use client";

import { useState } from "react";
import { useStudioStore } from "@/store/studio";
import { GemCanvas } from "../GemCanvas";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";

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

  const grandTotal = store.cart.reduce((sum, g) => sum + g.totalPrice, 0);

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
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gems: store.cart.map((g) => ({
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
          })),
          customer: address,
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
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
            {copyText(copy, "cart_address_headline", "Where should we send it?")}
          </h2>
          <p className="font-body text-cocoa/60">
            {copyText(copy, "cart_address_subtitle", "We'll need this to ship your Remember Me Gem.")}
          </p>
          <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-gold to-blue" />
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
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {copyText(copy, "cart_headline", "Added to Cart")}
        </h2>
        <p className="font-body text-cocoa/60">
          {store.cart.length === 1
            ? copyText(copy, "cart_subtitle_single", "Your gem is ready for checkout, or add another to the same order.")
            : copyText(copy, "cart_subtitle_multi", "{count} gems ready for checkout.").replace(
                "{count}",
                String(store.cart.length)
              )}
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-gold to-blue" />
      </div>

      <div className="rounded-2xl bg-cream divide-y divide-cocoa/10 mb-8">
        {store.cart.map((g, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="shrink-0">
              <GemCanvas
                shape={g.shape}
                stoneColor={stoneSwatchColor(g.stone.name, g.stone.colorFamily)}
                stoneImageUrl={g.stone.stoneImageUrl}
                inlayColor={g.inlayColor}
                symbol={g.symbol ? { name: g.symbol.name, path: g.symbol.svgPathData, viewBox: g.symbol.viewBox } : null}
                side="front"
                maxWidth={56}
              />
            </div>
            <div className="flex-1">
              <p className="font-body text-cocoa">
                {g.stone.name} · {g.shape}
              </p>
              <p className="text-xs text-cocoa/50">
                In memory of {g.firstName} {g.lastName}
              </p>
            </div>
            <p className="font-body font-medium text-cocoa">${g.totalPrice}</p>
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        <p className="font-heading text-3xl text-cocoa">${grandTotal}</p>
      </div>

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
        <button
          onClick={() => setCollectingAddress(true)}
          className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa"
        >
          {copyText(copy, "cart_checkout_btn", "Start checkout")}
        </button>
      </div>
    </div>
  );
}
