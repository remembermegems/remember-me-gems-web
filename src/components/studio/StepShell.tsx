import { copyText } from "@/lib/notion/configuratorCopy";
import { ReassuranceNote } from "./SelectionContinue";
import { SectionDivider } from "@/components/SectionDivider";

export function StepShell({
  headline,
  subhead,
  children,
  onBack,
  onContinue,
  continueLabel,
  continueDisabled = false,
  showBack = true,
  copy = {},
}: {
  headline: string;
  subhead?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  // Explicit override (e.g. the dedication screen's "Review Your Gem") wins;
  // otherwise falls back to Notion's global_next_btn, then "Next step".
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
  copy?: Record<string, string>;
}) {
  const resolvedContinueLabel = continueLabel ?? copyText(copy, "global_next_btn", "Next step");
  const resolvedBackLabel = copyText(copy, "global_back_btn", "Back");

  return (
    <div className="max-w-[720px] mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {headline}
        </h2>
        {subhead && <p className="font-body text-cocoa/60">{subhead}</p>}
        <SectionDivider className="mt-4" />
      </div>

      {children}

      {/* Selection screens pass no onContinue — their forward action lives at
          the selected card (SelectionContinue). Form screens get this single
          static button. Nothing in the Studio floats. */}
      <div className="flex justify-center gap-4 mt-10">
        {showBack && onBack && (
          <button onClick={onBack} className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa">
            {resolvedBackLabel}
          </button>
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold disabled:hover:text-warm-white"
          >
            {resolvedContinueLabel}
          </button>
        )}
      </div>

      {/* Selection screens carry this beside their own inline button instead,
          so it only belongs here on screens that own the button above. */}
      {onContinue && <ReassuranceNote copy={copy} className="text-center mt-4" />}
    </div>
  );
}
