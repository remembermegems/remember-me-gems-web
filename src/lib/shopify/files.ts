import { adminGraphQL, assertNoUserErrors } from "./client";

// Uploads a gem-render PNG to Shopify's own file storage, for punch list
// #31's "picture in the order confirmation email" half. Notion's signed S3
// URLs expire in ~1 hour — far too short-lived for an email someone opens
// days later — so the image needs a home Shopify itself controls. Requires
// the read_files/write_files Admin API scopes (added during the #34
// reconnect specifically so this wouldn't need a second owner-access
// round-trip).
//
// Shopify's file pipeline is three steps: ask for a staged upload slot,
// PUT the bytes there, then tell Shopify to adopt that upload as a real File.
// The resulting MediaImage processes asynchronously (fileStatus starts
// UPLOADED, not READY), so this polls briefly until a real CDN url appears.

const STAGED_UPLOADS_CREATE = /* GraphQL */ `
  mutation RmgStagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_CREATE = /* GraphQL */ `
  mutation RmgFileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        ... on MediaImage {
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FILE_STATUS = /* GraphQL */ `
  query RmgFileStatus($id: ID!) {
    node(id: $id) {
      ... on MediaImage {
        fileStatus
        image {
          url
        }
      }
    }
  }
`;

async function pollForReadyUrl(fileId: string, attempts = 8, delayMs = 750): Promise<string | null> {
  for (let i = 0; i < attempts; i += 1) {
    const data = await adminGraphQL<{ node: { fileStatus: string; image?: { url: string } } | null }>(FILE_STATUS, {
      id: fileId,
    });
    const url = data.node?.image?.url;
    if (url) return url;
    if (data.node?.fileStatus === "FAILED") return null;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

// Returns the stable CDN url, or null on any failure — the caller treats
// this as best-effort (same spirit as decrementStoneInventory in orders.ts):
// a missing render image shouldn't fail the checkout or the order write,
// since the order itself matters far more than this nice-to-have.
export async function uploadGemRenderToShopify(pngBuffer: Buffer, filename: string): Promise<string | null> {
  try {
    const staged = await adminGraphQL<{
      stagedUploadsCreate: {
        stagedTargets: { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[];
        userErrors: { field?: string[] | null; message: string }[];
      };
    }>(STAGED_UPLOADS_CREATE, {
      input: [
        {
          resource: "IMAGE",
          filename,
          mimeType: "image/png",
          httpMethod: "POST",
          fileSize: String(pngBuffer.byteLength),
        },
      ],
    });
    assertNoUserErrors(staged.stagedUploadsCreate.userErrors, "stagedUploadsCreate");
    const target = staged.stagedUploadsCreate.stagedTargets[0];
    if (!target) return null;

    const form = new FormData();
    for (const { name, value } of target.parameters) form.append(name, value);
    form.append("file", new Blob([new Uint8Array(pngBuffer)], { type: "image/png" }), filename);
    const uploadRes = await fetch(target.url, { method: "POST", body: form });
    if (!uploadRes.ok) {
      console.warn("[shopify/files] Staged upload PUT failed", uploadRes.status, await uploadRes.text());
      return null;
    }

    const created = await adminGraphQL<{
      fileCreate: {
        files: { id: string; fileStatus: string; image?: { url: string } }[];
        userErrors: { field?: string[] | null; message: string }[];
      };
    }>(FILE_CREATE, {
      files: [{ originalSource: target.resourceUrl, contentType: "IMAGE" }],
    });
    assertNoUserErrors(created.fileCreate.userErrors, "fileCreate");
    const file = created.fileCreate.files[0];
    if (!file) return null;
    if (file.image?.url) return file.image.url;

    return await pollForReadyUrl(file.id);
  } catch (err) {
    console.warn("[shopify/files] Gem render upload failed", err);
    return null;
  }
}
