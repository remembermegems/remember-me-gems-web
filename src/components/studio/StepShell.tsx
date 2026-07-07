import { copyText } from "@/lib/notion/configuratorCopy";

export function StepShell({
  headline,
  subhead,
  children,
  onBack,
  onContinue,
  continueLabel,
  continueDisabled = false,
  showBack = true,
  stickyContinue = false,
  copy = {},
}: {
  headline: string;
  subhead?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  // Explicit override (e.g. Inlay's "Review Your Gem") wins; otherwise falls
  // back to Notion's global_next_btn, then "Continue".
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
  // Screens with a potentially long scrollable list (Stone, Shape, Symbol)
  // opt into a floating Continue button once a selection is made, so the
  // way forward stays visible without scrolling back to the page bottom.
  stickyContinue?: boolean;
  copy?: Record<string, string>;
}) {
  const resolvedContinueLabel = continueLabel ?? copyText(copy, "global_next_btn", "Continue");
  const resolvedBackLabel = copyText(copy, "global_back_btn", "Back");

  return (
    <div className={`max-w-[720px] mx-auto px-6 py-16 ${stickyContinue ? "pb-28" : ""}`}>
      <div className="text-center mb-10">
        <h2 className="font-heading text-3xl text-cocoa mb-2" style={{ color: "#4E3F35" }}>
          {headline}
        </h2>
        {subhead && <p className="font-body text-cocoa/60">{subhead}</p>}
        <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-gold to-blue" />
      </div>

      {children}

      {/* stickyContinue screens keep only Back here — Continue lives exclusively
          in the fixed bottom-right button below, never duplicated inline. */}
      <div className="flex justify-center gap-4 mt-10">
        {showBack && onBack && (
          <button onClick={onBack} className="px-6 py-3 rounded-full font-body text-cocoa/60 hover:text-cocoa">
            {resolvedBackLabel}
          </button>
        )}
        {onContinue && !stickyContinue && (
          <button
            onClick={onContinue}
            disabled={continueDisabled}
            className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold disabled:hover:text-warm-white"
          >
            {resolvedContinueLabel}
          </button>
        )}
      </div>

      {stickyContinue && onContinue && (
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          className="fixed bottom-6 right-6 z-30 px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold shadow-lg transition-colors hover:bg-transparent hover:text-cocoa disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold disabled:hover:text-warm-white"
        >
          {resolvedContinueLabel}
        </button>
      )}
    </div>
  );
}
