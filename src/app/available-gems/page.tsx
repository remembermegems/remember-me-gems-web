import { getStones } from "@/lib/notion/stones";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { StoneCatalog } from "@/components/catalog/StoneCatalog";

export const revalidate = 120;

export default async function AvailableGemsPage() {
  const [stones, copy, sections] = await Promise.all([
    getStones(),
    getConfiguratorCopy(),
    getWebsiteCopy("Available Gems"),
  ]);
  const betaMode = copyText(copy, "global_beta_mode", "true") === "true";
  const intro = sections[0];

  return (
    <div>
      <Hero headline={intro?.headline || "Available Gemstones"} body={intro?.body} videoUrl={intro?.videoUrl} videoFileUrl={intro?.videoFileUrl} lens />
      <StoneCatalog stones={stones} betaMode={betaMode} beginLabel={intro?.ctaLabel || undefined} />
    </div>
  );
}
