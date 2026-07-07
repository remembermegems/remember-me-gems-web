"use client";

import Link from "next/link";
import { useState } from "react";

const EXPLORE_LINKS = [
  { label: "Gemstones", href: "/available-gems" },
  { label: "Symbols", href: "/symbols" },
  { label: "Shapes", href: "/shapes" },
];

const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Our Story", href: "/our-story" },
  { label: "FAQ", href: "/faq" },
  { label: "Special Requests", href: "/special-requests" },
];

export function Nav({ logoUrl }: { logoUrl?: string | null }) {
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <header className="bg-cream">
      <div className="flex justify-center py-4">
        <Link href="/" aria-label="Remember Me Gems">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Remember Me Gems" className="h-[176px] w-auto" />
          ) : (
            <span className="font-heading text-2xl text-cocoa" style={{ fontSize: "1.75rem" }}>
              Remember Me Gems
            </span>
          )}
        </Link>
      </div>
      <nav className="flex justify-center gap-8 pb-4 text-sm font-body text-cocoa/80">
        <Link href="/how-it-works" className="hover:text-cocoa">
          How It Works
        </Link>
        <div className="relative">
          <button onClick={() => setExploreOpen((v) => !v)} className="hover:text-cocoa flex items-center gap-1">
            Explore <span className="text-xs">▾</span>
          </button>
          {exploreOpen && (
            <>
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-0 cursor-default"
                onClick={() => setExploreOpen(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-warm-white rounded-xl shadow-md py-2 min-w-[160px] z-10">
                {EXPLORE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setExploreOpen(false)}
                    className="block px-4 py-2 hover:bg-cream whitespace-nowrap"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
        {NAV_LINKS.slice(1).map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-cocoa">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
