/**
 * Registers the orders/paid webhook with Shopify.
 *
 *   npx tsx --env-file=.env.local scripts/shopify-register-webhooks.ts --list
 *   npx tsx --env-file=.env.local scripts/shopify-register-webhooks.ts --apply https://your-site.com
 *
 * Requires a PUBLIC HTTPS callback URL — Shopify will not deliver to localhost,
 * so this can't be run meaningfully until the site is deployed (or fronted by
 * a tunnel). Idempotent: re-registering the same topic+URL is a no-op, and a
 * changed URL updates the existing subscription rather than adding a second.
 */
import { adminGraphQL, assertNoUserErrors } from "../src/lib/shopify/client";

const TOPIC = "ORDERS_PAID";

const LIST = /* GraphQL */ `
  query RmgWebhooks {
    webhookSubscriptions(first: 50) {
      nodes {
        id
        topic
        endpoint {
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation RmgWebhookCreate($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
      webhookSubscription {
        id
        topic
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation RmgWebhookUpdate($id: ID!, $sub: WebhookSubscriptionInput!) {
    webhookSubscriptionUpdate(id: $id, webhookSubscription: $sub) {
      webhookSubscription {
        id
        topic
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type Existing = {
  webhookSubscriptions: { nodes: { id: string; topic: string; endpoint: { callbackUrl?: string } }[] };
};

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const baseUrl = args.find((a) => a.startsWith("http"));

  const existing = await adminGraphQL<Existing>(LIST);
  console.log(`\nExisting webhook subscriptions: ${existing.webhookSubscriptions.nodes.length}`);
  for (const w of existing.webhookSubscriptions.nodes) {
    console.log(`  ${w.topic.padEnd(18)} ${w.endpoint?.callbackUrl ?? "(non-http endpoint)"}`);
  }

  if (!apply) {
    console.log(`\nPass --apply https://your-site.com to register ${TOPIC}.\n`);
    return;
  }

  if (!baseUrl) {
    console.error(`\nA public https:// base URL is required, e.g.:\n  --apply https://remembermegems.netlify.app\n`);
    process.exit(1);
  }
  if (!baseUrl.startsWith("https://")) {
    console.error(`\nShopify requires https for webhook endpoints. Got: ${baseUrl}\n`);
    process.exit(1);
  }

  const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/shopify/webhooks/orders-paid`;
  const match = existing.webhookSubscriptions.nodes.find((w) => w.topic === TOPIC);

  if (match && match.endpoint?.callbackUrl === callbackUrl) {
    console.log(`\n${TOPIC} already points at ${callbackUrl} — nothing to do.\n`);
    return;
  }

  if (match) {
    const data = await adminGraphQL<{
      webhookSubscriptionUpdate: { userErrors: { field?: string[] | null; message: string }[] };
    }>(UPDATE, { id: match.id, sub: { callbackUrl, format: "JSON" } });
    assertNoUserErrors(data.webhookSubscriptionUpdate.userErrors, "webhookSubscriptionUpdate");
    console.log(`\nUpdated ${TOPIC} -> ${callbackUrl}\n`);
    return;
  }

  const data = await adminGraphQL<{
    webhookSubscriptionCreate: { userErrors: { field?: string[] | null; message: string }[] };
  }>(CREATE, { topic: TOPIC, sub: { callbackUrl, format: "JSON" } });
  assertNoUserErrors(data.webhookSubscriptionCreate.userErrors, "webhookSubscriptionCreate");
  console.log(`\nRegistered ${TOPIC} -> ${callbackUrl}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
