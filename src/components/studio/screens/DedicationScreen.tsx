"use client";

import { useRef, useState } from "react";
import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { GemCanvas } from "../GemCanvas";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";
import type { LetteringStyle } from "@/lib/notion/types";

const LETTERING_STYLES: LetteringStyle[] = ["Flowing Script", "Monument"];
const LETTERING_STYLE_KEY: Record<LetteringStyle, string> = {
  "Flowing Script": "lettering_option_script",
  Monument: "lettering_option_block",
};

// The permanent-engraving screen: initials (or an explicit opt-out) plus who
// the gem honors. Deliberately the last stop before Review — the customer has
// already designed the piece, so the heaviest question lands when they're
// invested rather than cold on arrival, and the one irreversible choice
// (engraved initials) no longer rides along with inlay color.
export function DedicationScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();

  const [firstName, setFirstName] = useState(store.firstName);
  const [lastName, setLastName] = useState(store.lastName);
  const [birthYear, setBirthYear] = useState(store.birthYear);
  const [deathYear, setDeathYear] = useState(store.deathYear);

  const initialBoxes = useRef<(HTMLInputElement | null)[]>([]);

  if (!store.shape || !store.stone) return null;

  const tileColor = stoneSwatchColor(store.stone.name, store.stone.colorFamily);
  const inlay = store.inlayColor ?? "Natural";
  const lettering = store.letteringStyle ?? "Monument";
  const declined = store.declinedInitials;

  // Either real initials or a deliberate opt-out — a blank field on its own
  // can't tell "doesn't want them" from "hasn't filled it in yet".
  const initialsResolved = declined || store.initials.trim().length > 0;
  const canContinue = initialsResolved && firstName.trim().length > 0 && lastName.trim().length > 0;

  function writeInitial(index: number, raw: string) {
    const char = raw.slice(-1);
    const chars = store.initials.padEnd(3, " ").split("");
    chars[index] = char;
    store.setInitials(chars.join("").trimEnd());
    // Auto-advance so "MOM" is three keystrokes, not three keystrokes plus two
    // deliberate taps into the next box.
    if (char && index < 2) initialBoxes.current[index + 1]?.focus();
  }

  function handleInitialKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      e.preventDefault();
      const chars = store.initials.padEnd(3, " ").split("");
      chars[index - 1] = " ";
      store.setInitials(chars.join("").trimEnd());
      initialBoxes.current[index - 1]?.focus();
    }
  }

  return (
    <StepShell
      headline={copyText(copy, "dedication_headline", "The last few details")}
      copy={copy}
      onBack={store.goBack}
      continueDisabled={!canContinue}
      onContinue={() => {
        if (!store.letteringStyle) store.setLetteringStyle("Monument");
        store.setInMemoryOf({ firstName, lastName, birthYear, deathYear });
        store.goNext();
      }}
      continueLabel={copyText(copy, "dedication_continue_btn", "Review Your Gem")}
    >
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <GemCanvas
            shape={store.shape}
            stoneColor={tileColor}
            stoneImageUrl={store.stone.stoneImageUrl}
            inlayColor={inlay}
            side="back"
            initials={store.initials}
            letteringStyle={lettering}
            maxWidth={180}
            stoneName={store.stone.name}
          />
          <p className="text-xs text-cocoa/50 mt-2">Back</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-1">
          {copyText(copy, "dedication_initials_label", "Initials")}
        </p>
        <p className="text-center text-cocoa/60 text-sm mb-4">
          {copyText(copy, "initials_helper", "We'll engrave their initials on the back.")}
        </p>
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              ref={(el) => {
                initialBoxes.current[i] = el;
              }}
              maxLength={1}
              disabled={declined}
              aria-label={`Initial ${i + 1} of 3`}
              value={store.initials[i]?.trim() ?? ""}
              onChange={(e) => writeInitial(i, e.target.value)}
              onKeyDown={(e) => handleInitialKeyDown(i, e)}
              className="w-14 h-14 text-center text-xl rounded-xl border border-cocoa/15 bg-warm-white font-heading uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            />
          ))}
        </div>
      </div>

      <label className="flex items-center justify-center gap-2.5 mb-8 cursor-pointer">
        <input
          type="checkbox"
          checked={declined}
          onChange={(e) => store.setDeclinedInitials(e.target.checked)}
          className="w-4 h-4 accent-cocoa"
        />
        <span className="font-body text-sm text-cocoa/70">
          {copyText(copy, "dedication_no_initials_label", "I don't want initials on the back of my gem")}
        </span>
      </label>

      {/* Lettering style only exists to shape the initials, so it disappears
          entirely once the customer has opted out of them. */}
      {!declined && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-3">
            {copyText(copy, "dedication_lettering_label", "Lettering style")}
          </p>
          <div className="flex justify-center gap-3">
            {LETTERING_STYLES.map((l) => (
              <button
                key={l}
                onClick={() => store.setLetteringStyle(l)}
                aria-pressed={lettering === l}
                className={`px-4 py-2 rounded-full text-sm border ${
                  lettering === l ? "bg-cocoa text-warm-white border-cocoa" : "border-cocoa/20 text-cocoa/70"
                }`}
              >
                {copyText(copy, LETTERING_STYLE_KEY[l], l)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!declined && (
        <p className="text-center text-sm mb-10">
          <a href="/special-requests" className="text-blue underline">
            {copyText(copy, "inlay_special_request_link", "Need more than 3 characters? Make a special request")}
          </a>
        </p>
      )}

      <div className="border-t border-cocoa/10 pt-8">
        <p className="text-xs uppercase tracking-wide text-cocoa/50 text-center mb-4">
          {copyText(copy, "dedication_honoree_label", "Who is this Remember Me Gem honoring?")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            aria-label="First name"
            className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            aria-label="Last name"
            className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
          />
        </div>
        <p className="text-sm text-cocoa/50 mb-2">
          {copyText(copy, "dedication_years_label", "If you'd like to include them — entirely optional.")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="Year of birth"
            aria-label="Year of birth"
            className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
          />
          <input
            value={deathYear}
            onChange={(e) => setDeathYear(e.target.value)}
            placeholder="Year of passing"
            aria-label="Year of passing"
            className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
          />
        </div>
      </div>
    </StepShell>
  );
}
