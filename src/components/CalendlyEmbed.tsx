"use client";

import Script from "next/script";

// Extracts the data-url from the raw embed snippet stored in Notion (the
// "Schedule a Conversation" row's Notes field) rather than injecting the
// snippet's HTML/script directly, so we control script loading ourselves.
function extractDataUrl(snippet: string): string | null {
  const match = snippet.match(/data-url="([^"]+)"/);
  return match ? match[1] : null;
}

export function CalendlyEmbed({ snippet }: { snippet: string }) {
  const dataUrl = extractDataUrl(snippet);
  if (!dataUrl) return null;

  return (
    <div className="max-w-[720px] mx-auto px-6 pb-16">
      <div className="calendly-inline-widget" data-url={dataUrl} style={{ minWidth: 320, height: 700 }} />
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" async />
    </div>
  );
}
