export type WebsitePage =
  | "Home"
  | "How It Works"
  | "Why a Remember Me Gem"
  | "How We Make Your Gem"
  | "Our Story"
  | "Our Promise"
  | "FAQ"
  | "Care"
  | "Contact"
  | "Create Your Remember Me Gem"
  | "Available Gems"
  | "Special Requests"
  | "Symbols"
  | "Shapes"
  | "Privacy Policy"
  | "Terms of Use"
  | "Global";

export type WebsiteCopySection = {
  id: string;
  page: WebsitePage;
  section: string;
  displayOrder: number;
  label: string;
  headline: string;
  body: string;
  pullQuote: string;
  links: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string | null;
  imageNotes: string;
  // Descriptive alt text for `imageUrl`, authored per-row in Notion. Distinct
  // from `imageNotes` (a placeholder-era brief describing what photo *should*
  // go here) and from reusing `headline`, which describes the section rather
  // than the picture. Empty until Anthony fills it in alongside each upload.
  altText: string;
  // Second image slot — added for the Home page's "Up Close" section (punch
  // list #32), which shows a front photo and a back photo of one gem. Empty
  // on every other row; unrelated to `imageUrl`/`altText` above.
  image2Url: string | null;
  image2AltText: string;
  // Mobile-specific crop for a full-bleed hero photo (punch list #32) — the
  // Home hero needs a different crop on narrow screens than the wide
  // landscape crop `imageUrl` holds for desktop. Falls back to `imageUrl`
  // when empty, so every other row (which never sets this) is unaffected.
  imageMobileUrl: string | null;
  // Pipe-separated trust checkmarks under the Home hero CTA (punch list #32),
  // same parsing convention as `links`. Empty on every row except Home's Hero.
  trustPoints: string;
  // Video from a platform URL (YouTube/Vimeo/TikTok/Instagram) — parsed, never
  // injected raw. See VideoEmbed.tsx.
  videoUrl: string;
  // Video uploaded straight into Notion (Files & media). Most robust option;
  // MP4/H.264 only — .mov won't play in Chrome or Firefox.
  videoFileUrl: string | null;
  notes: string;
};

export type ConfiguratorStep =
  | "Welcome"
  | "In Memory Of"
  | "Form Factor"
  | "Stone"
  | "Shape"
  | "Symbol"
  | "Back Engraving"
  | "Inlay Color"
  | "Review"
  | "Customer Info"
  | "Confirmation"
  | "Global";

export type ConfiguratorCopyRow = {
  id: string;
  key: string;
  step: ConfiguratorStep;
  type: string;
  text: string;
  channel: "Web" | "Event" | "Both";
  notes: string;
  // Only populated on the handful of rows that back a Studio tile photo
  // (e.g. "Where would you like to begin?", "How to carry it") — most rows
  // are text-only and this stays null.
  imageUrl: string | null;
};

export type Stone = {
  id: string;
  name: string;
  betaPrice: number;
  launchPrice: number;
  touchstoneUpcharge: number;
  grouping: string[];
  colorFamily: string | null;
  metaphysicalThemes: string[];
  metaphysicalProperties: string;
  stoneDescription: string;
  compatibleInlayColors: string[];
  shapeRestrictions: string[];
  availableForSale: boolean;
  premiumBadge: boolean;
  featuredOnHomepage: boolean;
  lowStockThreshold: number | null;
  originalQuantity: number | null;
  stoneImageUrl: string | null;
  polishedPhotoUrl: string | null;
  // Descriptive alt text for this stone's photos, authored in Notion.
  // Falls back to the stone name, which names the subject but doesn't
  // describe it — see lib/altText.ts.
  imageAltText: string;
};

export type Symbol = {
  id: string;
  name: string;
  meaning: string;
  grouping: string[];
  compatibleShapes: string[];
  svgPathData: string;
  viewBox: string;
  universal: boolean;
  available: boolean;
  customAddOn: boolean;
  upcharge: number;
  displayOrder: number;
};

export const SHAPE_NAMES = [
  "Teardrop",
  "Classic Oval",
  "Slim Oval",
  "Keepsake Rectangle",
  "Tall Rectangle",
  "Petite Rectangle",
  "Keepsake Square",
  "Dog Tag",
  "Petite Dog Tag",
  "Arrow",
  "Shield",
  "Oval Touchstone",
  "Dog Tag Touchstone",
  // Added 2026-09-18 (Anthony's request).
  "Tall Touchstone",
  "Keepsake Tag",
  "Round Touchstone",
  "Petite Circle Pendant",
] as const;

export type ShapeName = (typeof SHAPE_NAMES)[number];

export type CarryType = "Wear It" | "Carry It" | "Hang It";

export const INLAY_COLORS = ["Natural", "Gold", "Silver", "White", "Turquoise", "Metallic Black", "Copper"] as const;
export type InlayColor = (typeof INLAY_COLORS)[number];

export type LetteringStyle = "Flowing Script" | "Monument";

export type OrderInput = {
  firstName: string;
  lastName: string;
  birthYear?: string;
  deathYear?: string;
  stoneId: string;
  stoneName: string;
  shapeName: ShapeName;
  carryType?: CarryType;
  symbolName: string;
  inlayColor: InlayColor;
  letteringStyle: LetteringStyle;
  initials: string;
  // Distinct from initials === "" — records whether a blank field was a
  // deliberate customer choice or something going wrong (2026-08-02).
  declinedInitials?: boolean;
  addOns: string[];
  basePrice: number;
  totalPrice: number;
  channel: "Web" | "Event";
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  contactPreference?: "Email" | "Phone";
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  // Set from the live global_beta_mode flag at checkout time — when true,
  // real stone inventory isn't decremented (siblings/testers clicking
  // through the Studio shouldn't affect real counts).
  betaMode: boolean;
  // Shared across every gem placed in the same checkout, so a multi-gem
  // order's rows in "RMG Orders & Production" can be grouped even though
  // each gem keeps its own row/status for production tracking.
  orderId: string;
};
