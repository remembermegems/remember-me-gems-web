// Pure URL parsing for VideoEmbed — kept separate from the component so it has
// no React/next dependencies and can be exercised directly.
//
// Only the video ID is ever extracted; the embed URL is then built by us. A
// CMS value is never interpolated into a src wholesale, and anything that
// doesn't match a strict ID pattern is rejected outright rather than passed
// through. Same principle as CalendlyEmbed: pull the one value we need, don't
// trust the surrounding string.

type Platform = "youtube" | "vimeo" | "tiktok" | "instagram";

type ParsedVideo = { platform: Platform; id: string; url: string };

// Strict ID patterns — anything that doesn't match is rejected rather than
// interpolated into a src, so a malformed or hostile CMS value can't build an
// arbitrary URL.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const NUMERIC_ID = /^\d+$/;
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,20}$/;

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  // YouTube — watch?v=, youtu.be/, /embed/, /shorts/
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return { platform: "youtube", id: v, url: trimmed };
    const idx = segments.findIndex((s) => s === "embed" || s === "shorts" || s === "live");
    const candidate = idx >= 0 ? segments[idx + 1] : undefined;
    if (candidate && YOUTUBE_ID.test(candidate)) return { platform: "youtube", id: candidate, url: trimmed };
    return null;
  }
  if (host === "youtu.be") {
    const candidate = segments[0];
    if (candidate && YOUTUBE_ID.test(candidate)) return { platform: "youtube", id: candidate, url: trimmed };
    return null;
  }

  // Vimeo — vimeo.com/123456789 or player.vimeo.com/video/123456789
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const candidate = segments[segments.length - 1];
    if (candidate && NUMERIC_ID.test(candidate)) return { platform: "vimeo", id: candidate, url: trimmed };
    const numeric = segments.find((s) => NUMERIC_ID.test(s));
    if (numeric) return { platform: "vimeo", id: numeric, url: trimmed };
    return null;
  }

  // TikTok — tiktok.com/@user/video/1234567890
  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    const idx = segments.findIndex((s) => s === "video");
    const candidate = idx >= 0 ? segments[idx + 1] : undefined;
    if (candidate && NUMERIC_ID.test(candidate)) return { platform: "tiktok", id: candidate, url: trimmed };
    return null;
  }

  // Instagram — instagram.com/p/CODE or /reel/CODE
  if (host === "instagram.com") {
    const idx = segments.findIndex((s) => s === "p" || s === "reel" || s === "tv");
    const candidate = idx >= 0 ? segments[idx + 1] : undefined;
    if (candidate && INSTAGRAM_CODE.test(candidate)) return { platform: "instagram", id: candidate, url: trimmed };
    return null;
  }

  return null;
}
