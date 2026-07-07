"use client";

import { useState } from "react";
import type { WebsiteCopySection } from "@/lib/notion/types";

const GROUPS = ["About the Gem", "About the Ashes", "About the Process", "Care & Craftsmanship"];

export function FaqAccordion({ sections }: { sections: WebsiteCopySection[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="max-w-[720px] mx-auto px-6 py-12">
      <div className="flex flex-wrap justify-center gap-2 mb-10 sticky top-0 bg-cream py-3 z-10">
        {GROUPS.map((g) => (
          <a
            key={g}
            href={`#${g.replace(/\s+/g, "-").toLowerCase()}`}
            className="px-3 py-1.5 rounded-full text-sm border border-cocoa/20 text-cocoa/70 hover:bg-cocoa hover:text-warm-white"
          >
            {g}
          </a>
        ))}
      </div>

      {GROUPS.map((group) => {
        const questions = sections.filter((s) => s.label === group);
        if (questions.length === 0) return null;
        return (
          <div key={group} id={group.replace(/\s+/g, "-").toLowerCase()} className="mb-10 scroll-mt-24">
            <h2 className="font-heading text-2xl text-cocoa mb-4">{group}</h2>
            <div className="space-y-2">
              {questions.map((q) => {
                const isOpen = open === q.id;
                return (
                  <div key={q.id} className="rounded-xl bg-warm-white">
                    <button
                      onClick={() => setOpen(isOpen ? null : q.id)}
                      className="w-full text-left px-5 py-4 font-body font-medium text-cocoa flex justify-between items-center"
                    >
                      {q.headline}
                      <span className="text-cocoa/40">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && <p className="px-5 pb-4 text-cocoa/80 font-body">{q.body}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
