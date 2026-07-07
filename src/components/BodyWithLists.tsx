import { parseBodyBlocks } from "@/lib/parseBodyBlocks";
import { CheckList, DashList, StarList, DiamondList } from "@/components/ListMarkers";

const LIST_COMPONENTS = {
  check: CheckList,
  dash: DashList,
  star: StarList,
  diamond: DiamondList,
} as const;

// Renders a Notion Body field that may embed "- " markdown lists inline,
// giving list blocks the marker treatment (checkmark/dash/star/diamond) the
// design system calls for instead of showing them as plain paragraph text.
export function BodyWithLists({ body, listType = "diamond" }: { body: string; listType?: keyof typeof LIST_COMPONENTS }) {
  const blocks = parseBodyBlocks(body);
  const ListComponent = LIST_COMPONENTS[listType];

  return (
    <>
      {blocks.map((block, i) =>
        block.type === "prose" ? (
          <p key={i} className="font-body text-cocoa/80 whitespace-pre-line mb-4">
            {block.text}
          </p>
        ) : (
          <div key={i} className="mb-4">
            <ListComponent items={block.items} />
          </div>
        )
      )}
    </>
  );
}
