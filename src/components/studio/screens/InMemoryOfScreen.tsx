"use client";

import { useState } from "react";
import { useStudioStore } from "@/store/studio";
import { StepShell } from "../StepShell";
import { GemCanvas } from "../GemCanvas";
import { SymbolTile } from "@/components/SymbolTile";
import { stoneSwatchColor } from "@/lib/studio/shapeGeometry";
import { copyText } from "@/lib/notion/configuratorCopy";

function ChosenStrip() {
  const { stone, shape, symbol, beginChoice } = useStudioStore();
  if (!beginChoice) return null;

  const label = stone?.name ?? symbol?.name ?? shape;
  if (!label) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dusty-sky bg-dusty-sky/10 px-4 py-2.5 mb-8 max-w-sm mx-auto">
      <div className="shrink-0 flex items-center justify-center" style={{ width: 30, height: 30 }}>
        {stone && <div className="w-full h-full rounded-full" style={{ background: stoneSwatchColor(stone.name, stone.colorFamily) }} />}
        {symbol && <SymbolTile name={symbol.name} path={symbol.svgPathData} viewBox={symbol.viewBox} size={30} />}
        {shape && !stone && !symbol && <GemCanvas shape={shape} stoneColor="#AFC4D6" inlayColor="Gold" maxWidth={30} />}
      </div>
      <div>
        <p className="text-xs text-cocoa/50 font-body leading-tight">You&rsquo;ve chosen</p>
        <p className="text-sm font-body font-medium text-cocoa leading-tight">{label}</p>
      </div>
    </div>
  );
}

export function InMemoryOfScreen({ copy }: { copy: Record<string, string> }) {
  const store = useStudioStore();
  const [firstName, setFirstName] = useState(store.firstName);
  const [lastName, setLastName] = useState(store.lastName);
  const [birthYear, setBirthYear] = useState(store.birthYear);
  const [deathYear, setDeathYear] = useState(store.deathYear);

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

  return (
    <StepShell
      headline={copyText(copy, "memory_headline", "Tell us about the person you're honoring")}
      subhead={copyText(copy, "memory_subtitle", "We'll keep their name close throughout this journey.")}
      copy={copy}
      showBack={false}
      continueDisabled={!canContinue}
      onContinue={() => {
        store.setInMemoryOf({ firstName, lastName, birthYear, deathYear });
        store.goNext();
      }}
    >
      <ChosenStrip />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
        />
      </div>
      <p className="text-sm text-cocoa/50 mb-2">If you&rsquo;d like to include it — entirely optional.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="Year of birth"
          className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
        />
        <input
          value={deathYear}
          onChange={(e) => setDeathYear(e.target.value)}
          placeholder="Year of passing"
          className="rounded-full border border-cocoa/15 bg-warm-white px-5 py-3 font-body"
        />
      </div>
    </StepShell>
  );
}
