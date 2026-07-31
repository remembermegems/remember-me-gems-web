"use client";

import { Hero } from "@/components/Hero";
import { useStudioStore } from "@/store/studio";

// The page-level intro banner belongs to the Studio's *entry* screen only.
// It used to render above the Studio on every step, so a customer six screens
// deep still had "There's no wrong way to begin" pushing the actual question
// below the fold — worst on mobile. Gating on "am I on the first step of my
// own path" keeps it correct for deep-link entries too, where the entry
// screen isn't "where-to-begin".
export function StudioIntro({
  headline,
  body,
  pullQuote,
}: {
  headline: string;
  body?: string;
  pullQuote?: string;
}) {
  const currentStep = useStudioStore((s) => s.currentStep);
  const firstStep = useStudioStore((s) => s.stepOrder[0]);

  if (currentStep !== firstStep) return null;

  return <Hero headline={headline} body={body} pullQuote={pullQuote} />;
}
