import type { Metadata } from "next";
import { Cinzel, Jost } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BetaBanner } from "@/components/BetaBanner";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import { getSymbols } from "@/lib/notion/symbols";
import { Analytics } from "@/components/Analytics";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Remember Me Gems",
  description: "Handcrafted memorial jewelry, made to keep them close.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [globalCopy, configuratorCopy, symbols] = await Promise.all([
    getWebsiteCopy("Global"),
    getConfiguratorCopy(),
    getSymbols(),
  ]);
  const logoUrl = globalCopy.find((s) => s.section === "Site Logo")?.imageUrl ?? null;
  // The Notion "Eternal Love Mark (gold)" image field is no longer used here —
  // it's a rasterized export that isn't transparent and looks bad against the
  // cocoa footer. Anthony's call 2026-07-06: render the real symbol path data
  // from the Symbol Library instead, same source the Symbols catalog uses.
  const eternalLoveSymbol = symbols.find((s) => s.name === "Eternal Love") ?? null;
  const betaMode = copyText(configuratorCopy, "global_beta_mode", "true") === "true";
  const bannerText = copyText(configuratorCopy, "global_beta_banner");

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-cocoa">
        <Analytics />
        <BetaBanner show={betaMode} text={bannerText} />
        <Nav logoUrl={logoUrl} />
        <main className="flex-1">{children}</main>
        <Footer eternalLoveSymbol={eternalLoveSymbol ? { path: eternalLoveSymbol.svgPathData, viewBox: eternalLoveSymbol.viewBox } : null} />
      </body>
    </html>
  );
}
