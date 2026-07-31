// GA4 event helpers.
//
// The Studio swaps steps client-side rather than navigating, so GA's automatic
// pageview tracking is blind to movement inside it — Stone → Shape → Symbol all
// look like a single page visit. These explicit events are what make the
// step-by-step funnel (and therefore drop-off analysis) visible at all.
//
// Standard GA4 ecommerce event names are used where one exists (add_to_cart,
// begin_checkout, purchase) so GA's built-in funnel and monetisation reports
// light up, rather than everything landing in custom-event reports. They're
// also payment-provider-agnostic, so they survive the Shopify migration
// unchanged (docs/studio-punch-list.md #25).

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const analyticsEnabled = () => Boolean(GA_MEASUREMENT_ID);

type GtagParams = Record<string, string | number | boolean | undefined | object[]>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Never throws and never blocks the UI: analytics failing (blocked script, ad
// blocker, no measurement ID configured) must not take a grieving customer's
// checkout down with it.
export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", name, params);
  } catch {
    // Swallowed deliberately — see above.
  }
}

export type StepEventParams = {
  step_name: string;
  step_number: number;
  total_steps: number;
  // "deep_link" when the customer arrived from a gallery page's "Begin with
  // this X" link (6-step path), "fresh" from a normal start (8-step path).
  entry_type: "fresh" | "deep_link";
};

export function trackStepView(params: StepEventParams): void {
  trackEvent("studio_step_view", params);
}

// Fired alongside the resulting step view, so genuine drop-off can be told
// apart from a customer simply backtracking to reconsider a choice.
export function trackStepBack(params: StepEventParams): void {
  trackEvent("studio_step_back", params);
}
