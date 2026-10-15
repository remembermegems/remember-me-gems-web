import { NextRequest, NextResponse } from "next/server";

// Same-origin re-serve of a Notion-hosted stone photo, used only by the #31
// gem-render snapshot capture (GemSnapshotCapture.tsx). The customer-visible
// GemCanvas instances draw straight from Notion's signed S3 URL and are
// unaffected by any of this — they never read pixels back off their canvas,
// so a cross-origin draw is fine for them. A capture-only canvas does need to
// call toDataURL(), though, and Notion's URLs carry no permissive CORS
// header, which taints a canvas drawn from them (SecurityError on
// toDataURL). Loading the same bytes through this route instead makes the
// <img> src same-origin, so the draw isn't cross-origin at all — no
// crossOrigin attribute or CORS header needed on either side.
export const runtime = "nodejs";

// Restricts this to actually being an image proxy for Notion's own file
// storage, not an open fetch-anything-on-our-server-and-return-it endpoint.
const ALLOWED_HOST_SUFFIXES = [".amazonaws.com", ".notion-static.com"];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOST_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix))) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // Signed Notion URLs expire in ~1 hour and are one-off per stone photo
      // request anyway — nothing useful to cache here.
      "Cache-Control": "no-store",
    },
  });
}
