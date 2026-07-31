import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

// Site-wide GA4 tag. Renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is
// unset, so local development and any environment without analytics configured
// stay clean rather than firing at a nonexistent property.
//
// The measurement ID is deliberately a NEXT_PUBLIC_ variable: it's embedded in
// the page source on every GA-tracked site by design and isn't a secret, but
// it still lives in .env.local rather than in source so it can differ per
// environment without a code change.
export function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
