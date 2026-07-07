const SQUARE_SANDBOX_API = "https://connect.squareupsandbox.com/v2";

export function hasSquareCredentials() {
  return Boolean(process.env.SQUARE_SANDBOX_ACCESS_TOKEN && process.env.SQUARE_SANDBOX_LOCATION_ID);
}

// Sandbox-only Checkout Link creation via Square's Orders + Checkout API.
// Real charging (production credentials) is explicitly out of scope for the
// alpha — see the build plan's "scoped demo" decision.
export async function createSquareCheckoutLink({
  referenceId,
  lineItems,
  redirectUrl,
}: {
  referenceId: string;
  lineItems: { name: string; amountCents: number }[];
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; orderId: string }> {
  const res = await fetch(`${SQUARE_SANDBOX_API}/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-10-17",
    },
    body: JSON.stringify({
      idempotency_key: referenceId,
      order: {
        location_id: process.env.SQUARE_SANDBOX_LOCATION_ID,
        reference_id: referenceId,
        line_items: lineItems.map((item) => ({
          name: item.name,
          quantity: "1",
          base_price_money: { amount: item.amountCents, currency: "USD" },
        })),
      },
      checkout_options: {
        redirect_url: redirectUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Square checkout link creation failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  return { checkoutUrl: json.payment_link.url, orderId: json.payment_link.order_id };
}
