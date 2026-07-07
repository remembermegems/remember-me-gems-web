import { notFound } from "next/navigation";
import { getStones } from "@/lib/notion/stones";
import { VignetteTuner } from "@/components/studio-debug/VignetteTuner";

// Dev-only debug harness — NOT linked from any nav, not part of the customer
// site. Lets Anthony tune the vignette (see GemCanvas's
// vignetteWidthFrac/vignetteBlurFrac/vignetteDarkness props) live across a
// few contrasting shapes, the same way the old render sandbox let him adjust
// render parameters interactively. Gated out of production below so it can't
// be reached on the live site even by a guessed URL.
export default async function VignetteDebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const stones = await getStones();
  const stone = stones.find((s) => s.name === "Lapis Lazuli") ?? stones[0];

  return <VignetteTuner stone={stone} />;
}
