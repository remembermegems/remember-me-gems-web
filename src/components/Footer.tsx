import Link from "next/link";

type SymbolPath = { path: string; viewBox: string };

const COLUMNS = [
  {
    title: "Create",
    links: [
      { label: "The Studio", href: "/create-your-remember-me-gem" },
      { label: "Available Gemstones", href: "/available-gems" },
      { label: "Symbols", href: "/symbols" },
      { label: "Shapes", href: "/shapes" },
      { label: "Special Requests", href: "/special-requests" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Why a Remember Me Gem", href: "/why-a-remember-me-gem" },
      { label: "How We Make Your Gem", href: "/how-we-make-your-gem" },
      { label: "Care", href: "/care" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Our Family",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Our Promise", href: "/our-promise" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer({ eternalLoveSymbol }: { eternalLoveSymbol?: SymbolPath | null }) {
  return (
    <footer className="bg-cocoa">
      <div className="max-w-[960px] mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-4 gap-10">
        <div>
          {eternalLoveSymbol && (
            <svg viewBox={eternalLoveSymbol.viewBox} className="h-5 w-auto mb-3" aria-hidden>
              <path d={eternalLoveSymbol.path} fill="#C6A164" fillRule="evenodd" />
            </svg>
          )}
          <p className="font-heading text-lg text-warm-white mb-2">Remember Me Gems</p>
          <p className="text-sm text-warm-white/70 italic mb-4">Keep them close.</p>
          <p className="text-sm text-warm-white/70">
            <a href="tel:+15058084367" className="hover:text-warm-white">
              505-808-GEMS
            </a>
          </p>
          <p className="text-sm text-warm-white/70">
            <a href="mailto:careteam@remembermegems.com" className="hover:text-warm-white">
              careteam@remembermegems.com
            </a>
          </p>
          <p className="text-sm text-warm-white/50 mt-4">Remember Me Pets — coming soon</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-body font-medium uppercase tracking-wide text-sm text-gold mb-3">{col.title}</p>
            <ul className="space-y-2 text-sm text-warm-white/70">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-warm-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[960px] mx-auto px-6 pb-10 flex gap-6 text-xs text-warm-white/50">
        <Link href="/privacy-policy" className="hover:text-warm-white">
          Privacy Policy
        </Link>
        <Link href="/terms-of-use" className="hover:text-warm-white">
          Terms of Use
        </Link>
      </div>
    </footer>
  );
}
