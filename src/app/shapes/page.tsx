import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { Hero } from "@/components/Hero";
import { ShapeCatalog } from "@/components/catalog/ShapeCatalog";

export const revalidate = 120;

export default async function ShapesPage() {
  const sections = await getWebsiteCopy("Shapes");
  const intro = sections[0];

  return (
    <div>
      <Hero headline={intro?.headline || "Shapes"} body={intro?.body} lens />
      <ShapeCatalog />
    </div>
  );
}
