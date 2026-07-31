"use client";

import Script from "next/script";
import { parseVideoUrl } from "@/lib/videoEmbed";

// Renders a video from a plain URL stored in a Notion text field — same
// security-conscious shape as CalendlyEmbed: we parse the one value we need
// (the video ID) out of the URL and build the embed ourselves, rather than
// injecting any HTML/script that came from the CMS.
//
// Two reliability tiers, per docs/studio-punch-list.md #21:
//   - YouTube / Vimeo: plain <iframe>, no external script, nothing to silently
//     break later. Use these for anything load-bearing.
//   - TikTok / Instagram: script-based embeds — the platform's script finds a
//     placeholder and hydrates it. More prone to load delay, style mismatch,
//     and breaking outright if the source post is deleted, made private, or
//     region-restricted. Fine for casual content only.
//
// A Notion-hosted file (uploaded straight into a Files & media property) is
// handled separately by NotionVideo below and is the most robust option of
// all: no third party involved at playback time.

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full max-w-[720px] mx-auto ${className}`}>{children}</div>;
}

// 16:9 iframe wrapper — aspect-video keeps it responsive without the old
// padding-bottom hack.
function IframeVideo({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-cocoa/5">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export function VideoEmbed({ url, title = "Video", className = "" }: { url: string | null; title?: string; className?: string }) {
  const parsed = url ? parseVideoUrl(url) : null;
  if (!parsed) return null;

  if (parsed.platform === "youtube") {
    return (
      <Frame className={className}>
        <IframeVideo src={`https://www.youtube-nocookie.com/embed/${parsed.id}`} title={title} />
      </Frame>
    );
  }

  if (parsed.platform === "vimeo") {
    return (
      <Frame className={className}>
        <IframeVideo src={`https://player.vimeo.com/video/${parsed.id}`} title={title} />
      </Frame>
    );
  }

  if (parsed.platform === "tiktok") {
    return (
      <Frame className={className}>
        <blockquote
          className="tiktok-embed mx-auto"
          cite={parsed.url}
          data-video-id={parsed.id}
          style={{ maxWidth: 605, minWidth: 288 }}
        >
          <section />
        </blockquote>
        <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
      </Frame>
    );
  }

  // Instagram
  return (
    <Frame className={className}>
      <blockquote
        className="instagram-media mx-auto"
        data-instgrm-permalink={`https://www.instagram.com/p/${parsed.id}/`}
        data-instgrm-version="14"
        style={{ maxWidth: 605, minWidth: 288, width: "100%" }}
      />
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
    </Frame>
  );
}

// Video uploaded directly into a Notion Files & media property. Most robust
// option — no third-party player, no external script, nothing to break if a
// social post is later deleted. Export MP4 (H.264), not .mov: Chrome and
// Firefox don't reliably play QuickTime containers in a native <video> tag.
//
// Note the same signed-URL expiry that applies to Notion images applies here:
// the URL is fetched fresh per request, so it's valid at render time.
export function NotionVideo({
  src,
  poster,
  className = "",
}: {
  src: string | null;
  poster?: string | null;
  className?: string;
}) {
  if (!src) return null;
  return (
    <Frame className={className}>
      <video
        src={src}
        poster={poster ?? undefined}
        controls
        preload="metadata"
        playsInline
        className="w-full rounded-2xl bg-cocoa/5"
      />
    </Frame>
  );
}
