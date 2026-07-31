"use client";

import { copyText } from "@/lib/notion/configuratorCopy";

// The forward action on a selection screen lives *at the card the customer
// just picked*, not floating over the viewport and not stranded at the bottom
// of a long list. Replaces the old `stickyContinue` floating button — pinned
// buttons sat on top of footer links on mobile and put the same action in a
// different place on every screen.
//
// The card's own check badge already says "this is selected", so the button
// only has to say what happens next. Hence a plain "Next step" rather than
// naming the choice again ("Select this gemstone"), which read as though the
// selection hadn't registered yet.
export function SelectionContinue({
  onContinue,
  copy,
  className = "",
}: {
  onContinue: () => void;
  copy: Record<string, string>;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-4 flex-wrap ${className}`}>
      <ReassuranceNote copy={copy} />
      <button
        onClick={onContinue}
        className="px-8 py-3 rounded-full font-body font-medium text-warm-white bg-gold border border-gold transition-colors hover:bg-transparent hover:text-cocoa"
      >
        {copyText(copy, "global_next_btn", "Next step")}
      </button>
    </div>
  );
}

// Sits beside the primary action on every Studio screen. Nothing here is
// irreversible until checkout, and saying so where the customer is deciding
// costs less hesitation than making them discover it by trying.
export function ReassuranceNote({ copy, className = "" }: { copy: Record<string, string>; className?: string }) {
  const note = copyText(copy, "global_reassurance_note", "You can review and change your choices at anytime.");
  if (!note) return null;
  return <p className={`font-body text-xs text-cocoa/50 ${className}`}>{note}</p>;
}

// Small gold tick pinned to a selected card. Decorative only — the selected
// state is announced to screen readers via aria-pressed on the card itself.
export function SelectedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`bg-gold text-warm-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 ${className}`}
    >
      ✓
    </span>
  );
}
