"use client";

import Link from "next/link";
import { useState } from "react";

const EXPLORE_LINKS = [
  { label: "Gemstones", href: "/available-gems" },
  { label: "Symbols", href: "/symbols" },
  { label: "Shapes", href: "/shapes" },
];

// FAQ and Special Requests were dropped from the top nav in the homepage
// redesign (punch list #32, 2026-08-25) — Anthony's call, confirmed both
// still live in the footer (Footer.tsx), so neither page loses its only
// entry point.
const RIGHT_LINKS = [
  { label: "Our Story", href: "/our-story" },
  { label: "Why a Remember Me Gem", href: "/why-a-remember-me-gem" },
];

function ExploreDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="hover:text-cocoa flex items-center gap-1">
        Explore <span className="text-xs">▾</span>
      </button>
      {open && (
        <>
          <button aria-label="Close menu" className="fixed inset-0 z-0 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-warm-white rounded-xl shadow-md py-2 min-w-[160px] z-10">
            {EXPLORE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="block px-4 py-2 hover:bg-cream whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Small mark-only logo (no wordmark) for the middle of the single-row nav —
// the old full lockup (176px tall, wordmark + tagline) pushed the fold way
// down on every page. Still meaningfully smaller than the old lockup, but
// sized up from the first pass (Anthony's call, 2026-08-25: too small at
// h-9) — `sizeClass` lets desktop/mobile each pick their own height while the
// surrounding row's own padding is what actually keeps the header short, not
// the logo itself being tiny.
function Mark({ logoUrl, sizeClass = "h-16" }: { logoUrl?: string | null; sizeClass?: string }) {
  return (
    <Link href="/" aria-label="Remember Me Gems" className="shrink-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Remember Me Gems" className={`${sizeClass} w-auto`} />
      ) : (
        <span className="font-heading text-base text-cocoa whitespace-nowrap">Remember Me Gems</span>
      )}
    </Link>
  );
}

export function Nav({ logoUrl }: { logoUrl?: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-cream relative">
      {/* Desktop / tablet: single centered row, logo mark in the middle.
          py-2 (not py-5, the first pass) is what keeps the row's total
          height in check now that the logo itself is bigger (h-16, up from
          h-9) — the row's height is governed by the taller of the two, so
          padding had to shrink as the logo grew to hold the total roughly
          steady. */}
      <nav className="hidden md:flex items-center justify-center gap-8 py-2 text-sm font-body text-cocoa/80">
        <Link href="/how-it-works" className="hover:text-cocoa">
          How It Works
        </Link>
        <ExploreDropdown />
        <Mark logoUrl={logoUrl} sizeClass="h-16" />
        {RIGHT_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-cocoa">
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: mark + hamburger toggle. 3-column grid centers the logo
          against the hamburger's width (a plain flex-justify-between left-
          justifies it instead, which read wrong per Anthony, 2026-08-25) —
          the empty first column mirrors the button's width so the middle
          column is the true center of the row, not just "left of the
          button". */}
      <div className="grid grid-cols-[1fr_auto_1fr] md:hidden items-center px-6 py-2">
        <div aria-hidden />
        <div className="flex justify-center">
          <Mark logoUrl={logoUrl} sizeClass="h-14" />
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="p-2 -mr-2 text-cocoa justify-self-end"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-full bg-cream border-t border-cocoa/10 shadow-md z-20">
          <nav className="flex flex-col px-6 py-4 gap-1 text-base font-body text-cocoa/80">
            <Link href="/how-it-works" className="py-2 hover:text-cocoa" onClick={() => setMobileOpen(false)}>
              How It Works
            </Link>
            <div className="py-2">
              <ExploreDropdown onNavigate={() => setMobileOpen(false)} />
            </div>
            {RIGHT_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="py-2 hover:text-cocoa" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
