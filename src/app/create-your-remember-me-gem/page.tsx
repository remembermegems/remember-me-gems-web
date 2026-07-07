import { getStones } from "@/lib/notion/stones";
import { getSymbols } from "@/lib/notion/symbols";
import { getConfiguratorCopy, copyText } from "@/lib/notion/configuratorCopy";
import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { Studio } from "@/components/studio/Studio";
import { SHAPES } from "@/lib/studio/shapes";
import { SHAPE_NAMES, type ShapeName } from "@/lib/notion/types";

export const revalidate = 60;

export default async function CreateYourGemPage({
  searchParams,
}: {
  searchParams: Promise<{ stone?: string; symbol?: string; shape?: string }>;
}) {
  const [{ stone: stoneParam, symbol: symbolParam, shape: shapeParam }, stones, symbols, copy, sections] = await Promise.all([
    searchParams,
    getStones(),
    getSymbols(),
    getConfiguratorCopy(),
    getWebsiteCopy("Create Your Remember Me Gem"),
  ]);
  const betaMode = copyText(copy, "global_beta_mode", "true") === "true";
  const intro = sections[0];

  // Deep-link entry from an Explore page's "Begin with this..." link — only
  // one of these should ever be present at once.
  const deepLinkStone = stoneParam ? (stones.find((s) => s.name === stoneParam) ?? null) : null;
  const deepLinkSymbol = symbolParam ? (symbols.find((s) => s.name === symbolParam) ?? null) : null;
  const deepLinkShape = shapeParam
    ? ((SHAPE_NAMES as readonly string[]).includes(shapeParam) && SHAPES.some((s) => s.name === shapeParam)
        ? (shapeParam as ShapeName)
        : null)
    : null;

  return (
    <div>
      {intro && <Hero headline={intro.headline} body={intro.body} />}
      <Studio
        stones={stones}
        symbols={symbols}
        betaMode={betaMode}
        copy={copy}
        deepLinkStone={deepLinkStone}
        deepLinkShape={deepLinkShape}
        deepLinkSymbol={deepLinkSymbol}
      />
    </div>
  );
}
