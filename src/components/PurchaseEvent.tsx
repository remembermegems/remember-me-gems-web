"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

// Fires GA4's standard `purchase` event once the confirmation page renders.
// Split out as a client component because order-confirmed is a server
// component (it writes the order to Notion and decrements inventory).
//
// Payment-provider-agnostic on purpose: it reads the order data this site
// already has, not anything Square-specific, so it survives the Shopify
// migration (docs/studio-punch-list.md #25) untouched.
export function PurchaseEvent({
  transactionId,
  value,
  items,
}: {
  transactionId: string;
  value: number;
  items: { item_id: string; item_name: string; item_category: string; price: number; quantity: number }[];
}) {
  // React runs effects twice in dev StrictMode, and a double-counted purchase
  // is the one event you really don't want inflated.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("purchase", {
      transaction_id: transactionId,
      currency: "USD",
      value,
      items,
    });
  }, [transactionId, value, items]);

  return null;
}
