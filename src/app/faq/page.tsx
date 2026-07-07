import { getWebsiteCopy } from "@/lib/notion/websiteCopy";
import { FaqAccordion } from "@/components/FaqAccordion";

export const revalidate = 120;

export default async function FaqPage() {
  const sections = await getWebsiteCopy("FAQ");

  return (
    <div>
      <div className="text-center pt-16 pb-4">
        <h1 className="font-heading text-4xl text-cocoa" style={{ color: "#4E3F35" }}>
          Frequently Asked Questions
        </h1>
      </div>
      <FaqAccordion sections={sections} />
    </div>
  );
}
