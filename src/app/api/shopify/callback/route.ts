import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { SHOPIFY_SHOP_DOMAIN, shopifyClientId, shopifyClientSecret } from "@/lib/shopify/config";

export const runtime = "nodejs";

// Shopify signs every OAuth callback. Recomputing the HMAC over the remaining
// query params proves the callback genuinely came from Shopify and wasn't
// forged or tampered with in transit — without this check, anyone could hit
// this route with a code of their choosing.
function validHmac(url: URL, secret: string): boolean {
  const params = new URLSearchParams(url.search);
  const hmac = params.get("hmac");
  if (!hmac) return false;
  params.delete("hmac");
  // Shopify excludes `signature` from the computation and expects the rest
  // sorted lexicographically.
  params.delete("signature");
  const message = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  try {
    // Constant-time compare — a plain === leaks timing information about how
    // much of the signature matched.
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(hmac, "utf8"));
  } catch {
    return false; // length mismatch
  }
}

function page(title: string, bodyHtml: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
     <style>
       body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f7f2ea;color:#4e3f35;
            display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}
       .card{background:#fffdf9;border-radius:16px;padding:32px;max-width:640px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
       h1{font-size:20px;margin:0 0 12px}
       code{display:block;background:#f7f2ea;padding:12px;border-radius:8px;word-break:break-all;
            font-size:13px;margin:12px 0;user-select:all}
       .muted{color:#4e3f35a0;font-size:14px;line-height:1.5}
     </style></head><body><div class="card">${bodyHtml}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// Step 2 of the one-time OAuth handshake (punch list #25): trade the
// authorization code for a long-lived offline Admin API access token.
//
// The token is shown once, here, for Anthony to paste into .env.local himself.
// Deliberately NOT written to disk automatically: a route handler that writes
// secrets to the filesystem in response to a web request is a pattern worth
// not having in the codebase at all, and this runs exactly once.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = shopifyClientSecret();

  const error = url.searchParams.get("error");
  if (error) {
    return page(
      "Shopify authorization declined",
      `<h1>Shopify authorization was declined</h1>
       <p class="muted">${url.searchParams.get("error_description") ?? error}</p>`,
      400
    );
  }

  if (!secret) {
    return page("Not configured", `<h1>SHOPIFY_CLIENT_SECRET is not set</h1>`, 500);
  }

  if (!validHmac(url, secret)) {
    return page(
      "Invalid signature",
      `<h1>Invalid HMAC signature</h1>
       <p class="muted">This callback didn't verify as coming from Shopify, so no token was requested.</p>`,
      401
    );
  }

  const expectedState = req.cookies.get("shopify_oauth_state")?.value;
  const state = url.searchParams.get("state");
  if (!expectedState || !state || expectedState !== state) {
    return page(
      "State mismatch",
      `<h1>State mismatch</h1>
       <p class="muted">This callback didn't match the install request that started it. Start again at
       <code>/api/shopify/install</code>.</p>`,
      401
    );
  }

  // Only accept a callback for the store this app is actually for — a valid
  // HMAC only proves Shopify sent it, not that it's the right shop.
  const shop = url.searchParams.get("shop");
  if (shop !== SHOPIFY_SHOP_DOMAIN) {
    return page("Unexpected shop", `<h1>Unexpected shop: ${shop}</h1>`, 400);
  }

  const code = url.searchParams.get("code");
  if (!code) return page("Missing code", `<h1>No authorization code returned</h1>`, 400);

  const tokenRes = await fetch(`https://${SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: shopifyClientId(),
      client_secret: secret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return page(
      "Token exchange failed",
      `<h1>Token exchange failed (${tokenRes.status})</h1><p class="muted">${body.slice(0, 500)}</p>`,
      502
    );
  }

  const json = (await tokenRes.json()) as { access_token?: string; scope?: string };
  if (!json.access_token) {
    return page("No token", `<h1>Shopify returned no access_token</h1>`, 502);
  }

  const res = page(
    "Shopify connected",
    `<h1>Shopify connected ✓</h1>
     <p class="muted">Paste this line into <strong>web/.env.local</strong>, then restart the dev server.
     This is the only time it will be shown.</p>
     <code>SHOPIFY_ADMIN_ACCESS_TOKEN=${json.access_token}</code>
     <p class="muted">Granted scopes: ${json.scope ?? "(none reported)"}</p>`
  );
  res.cookies.delete("shopify_oauth_state");
  return res;
}
