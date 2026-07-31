import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  SHOPIFY_SHOP_DOMAIN,
  SHOPIFY_SCOPES,
  shopifyClientId,
  shopifyRedirectUri,
  hasShopifyOAuthApp,
} from "@/lib/shopify/config";

export const runtime = "nodejs";

// Step 1 of the one-time OAuth handshake (punch list #25).
//
// Shopify's current platform no longer hands out a static Admin API token from
// a dashboard, so the token has to be earned through a real authorization
// code grant. Anthony visits this route once; it bounces him to Shopify's
// consent screen, and Shopify then calls /api/shopify/callback with a code.
//
// The `state` nonce is stored in an httpOnly cookie and checked on the way
// back, so a callback that didn't originate from this request is rejected —
// without it, an attacker could hand the merchant a crafted callback URL and
// have the app install a token for a shop they control.
export async function GET() {
  if (!hasShopifyOAuthApp()) {
    return NextResponse.json(
      { error: "SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET are not set in .env.local." },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const authorizeUrl = new URL(`https://${SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", shopifyClientId());
  authorizeUrl.searchParams.set("scope", SHOPIFY_SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", shopifyRedirectUri());
  authorizeUrl.searchParams.set("state", state);
  // No grant_options[]=per-user: we want an offline token, which keeps working
  // when nobody is logged in — this app syncs catalog and reads webhooks on
  // its own schedule, not on behalf of a signed-in user.

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
