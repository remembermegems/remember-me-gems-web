import { getSymbols } from "@/lib/notion/symbols";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { SymbolCatalog } from "@/components/catalog/SymbolCatalog";

export const revalidate = 120;

export default async function SymbolsPage() {
  const [symbols, sections] = await Promise.all([getSymbols(), getWebsiteCopy("Symbols")]);
  const intro = sections[0];

  return (
    <div>
      <Hero headline={intro?.headline || "Symbols"} body={intro?.body} videoUrl={intro?.videoUrl} videoFileUrl={intro?.videoFileUrl} lens />
      <SymbolCatalog symbols={symbols} beginLabel={intro?.ctaLabel || undefined} />
    </div>
  );
}
