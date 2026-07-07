import type { WebsiteCopySection } from "@/lib/notion/types";

// Dev-only placeholder copy, used when NOTION_TOKEN isn't set so the site is
// still browsable locally. The real, approved copy lives in the "RMG Website
// Copy" Notion database and is what actually ships once NOTION_TOKEN is set.
let counter = 0;
function row(partial: Partial<WebsiteCopySection> & Pick<WebsiteCopySection, "page" | "section">): WebsiteCopySection {
  counter += 1;
  return {
    id: `mock-${counter}`,
    displayOrder: counter * 10,
    label: "",
    headline: "",
    body: "",
    pullQuote: "",
    links: "",
    ctaLabel: "",
    ctaUrl: "",
    imageUrl: null,
    imageNotes: "",
    notes: "",
    ...partial,
  };
}

export const mockWebsiteCopy: WebsiteCopySection[] = [
  row({
    page: "Home",
    section: "Hero",
    headline: "Keep them close.",
    body: "Handcrafted memorial jewelry that carries a piece of your loved one with you, always.",
    ctaLabel: "Create Your Remember Me Gem",
    ctaUrl: "/create-your-remember-me-gem",
  }),
  row({
    page: "Home",
    section: "Why Gemstones",
    headline: "Why a gemstone?",
    body: "Every Remember Me Gem inlays a small amount of cremation ash into a hand-shaped gemstone, worn or carried close.",
  }),
  row({
    page: "Home",
    section: "Closing CTA",
    headline: "Ready to begin?",
    body: "Your gem, made by hand, for the person you'll always remember.",
    ctaLabel: "Create Your Remember Me Gem",
    ctaUrl: "/create-your-remember-me-gem",
  }),
  row({
    page: "FAQ",
    section: "About the Gem",
    label: "About the Gem",
    headline: "What is a Remember Me Gem?",
    body: "A hand-shaped gemstone with a small amount of cremation ash inlaid into an engraved symbol.",
  }),
  row({
    page: "Special Requests",
    section: "Intro",
    headline: "Have something specific in mind?",
    body: "If what you're picturing doesn't quite fit the Studio's standard options, let's talk it through together.",
  }),
  row({
    page: "Special Requests",
    section: "Calendly",
    notes:
      '<div class="calendly-inline-widget" data-url="https://calendly.com/anthony-storytimestones/30min" style="min-width:320px;height:700px;"></div><script src="https://assets.calendly.com/assets/external/widget.js" async></script>',
  }),
  row({
    page: "Create Your Remember Me Gem",
    section: "Intro",
    headline: "Let's create something to hold their memory.",
    body: "Take a breath. There's no wrong way to begin — the next few steps will help you shape a gem that feels like them.",
  }),
];
