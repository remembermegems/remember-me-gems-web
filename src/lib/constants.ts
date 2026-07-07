// Every closing CTA sitewide points to the Studio unless a row explicitly
// overrides it — used as a fallback when a Notion row has a CTA Label but
// its CTA URL field was left blank (a data gap, not something to silently
// hide the button for).
export const DEFAULT_CTA_URL = "/create-your-remember-me-gem";
