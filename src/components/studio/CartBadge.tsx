"use client";

import { useStudioStore, cartQuantity, cartLineTotal } from "@/store/studio";

// Persistent indicator while configuring a second (or later) gem, so the
// customer is never left wondering whether the first one is still "in" the
// order. Hidden on the cart screen itself since that already shows the
// contents in full.
export function CartBadge() {
  const cart = useStudioStore((s) => s.cart);
  const viewCart = useStudioStore((s) => s.viewCart);

  if (cart.length === 0) return null;

  // Counts physical gems, not cart rows — two of the same design is "2 gems
  // in cart," which is what the customer will actually receive in the box.
  const total = cart.reduce((sum, g) => sum + cartLineTotal(g), 0);
  const gemCount = cart.reduce((sum, g) => sum + cartQuantity(g), 0);

  return (
    <button
      onClick={viewCart}
      className="fixed top-4 right-4 z-40 flex items-center gap-2 rounded-full border border-gold bg-warm-white px-4 py-2 shadow-md font-body text-sm text-cocoa hover:bg-gold/10"
    >
      <span className="font-medium">
        {gemCount} {gemCount === 1 ? "gem" : "gems"} in cart
      </span>
      <span className="text-cocoa/50">· ${total}</span>
    </button>
  );
}
