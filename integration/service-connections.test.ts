import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const mailUrl = process.env.INTEGRATION_MAIL_URL ?? "http://localhost:3101";
const mediaUrl = process.env.INTEGRATION_MEDIA_URL ?? "http://localhost:3102";
const mailApiKey = process.env.MAIL_SERVICE_API_KEY ?? "local-development-key";
const mediaApiKey = process.env.MEDIA_SERVICE_API_KEY ?? "local-media-development-key";

async function responseJson(response: Response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.url} svarede med HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function waitFor<T>(operation: () => Promise<T | undefined>, description: string) {
  const deadline = Date.now() + 20_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const result = await operation();
      if (result !== undefined) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  throw new Error(`Timeout mens testen ventede på ${description}.`, { cause: lastError });
}

async function waitForHealth(baseUrl: string, expectedService: string) {
  return waitFor(async () => {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) return undefined;
    const body = await response.json() as { status?: string; service?: string };
    return body.status === "ok" && body.service === expectedService ? body : undefined;
  }, `${expectedService} /health`);
}

beforeAll(async () => {
  await Promise.all([
    waitForHealth(mailUrl, "boulde-mail-service"),
    waitForHealth(mediaUrl, "boulde-media-service")
  ]);
});

describe("forbindelsen til mail-servicen", () => {
  it("kører et velkomstmail-job gennem API, Redis, worker, SMTP og MongoDB", async () => {
    const uniqueId = randomUUID();
    const response = await fetch(`${mailUrl}/emails/welcome`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": mailApiKey },
      body: JSON.stringify({
        userId: `integration-${uniqueId}`,
        recipient: `integration-${uniqueId}@example.test`,
        data: { name: "Integrationstest" }
      })
    });
    const queued = await responseJson(response) as { jobId: string; status: string };

    expect(response.status).toBe(202);
    expect(queued.status).toBe("QUEUED");

    const mail = await waitFor(async () => {
      const statusResponse = await fetch(`${mailUrl}/emails/${encodeURIComponent(queued.jobId)}`, {
        headers: { "x-api-key": mailApiKey }
      });
      if (statusResponse.status === 404) return undefined;
      const body = await responseJson(statusResponse) as { mail: { status: string; recipient: string; providerMessageId?: string } };
      if (body.mail.status === "FAILED") throw new Error("Mailjobbet fejlede.");
      return body.mail.status === "SENT" ? body.mail : undefined;
    }, "at mail-worker sender velkomstmailen");

    expect(mail.recipient).toBe(`integration-${uniqueId}@example.test`);
    expect(mail.providerMessageId).toBeTruthy();
  });
});

describe("forbindelsen til media-servicen", () => {
  it("uploader, færdigmelder, finder og sletter en fil via API, MongoDB og MinIO", async () => {
    const projectId = `integration-${randomUUID()}`;
    const file = new TextEncoder().encode("boulde integration test");
    let mediaId: string | undefined;

    try {
      const prepareResponse = await fetch(`${mediaUrl}/media/uploads`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": mediaApiKey },
        body: JSON.stringify({
          ownerId: "integration-test",
          resourceType: "project",
          resourceId: projectId,
          contentType: "image/png",
          size: file.byteLength,
          note: "Integrationstest"
        })
      });
      const prepared = await responseJson(prepareResponse) as { mediaId: string; uploadUrl: string };
      mediaId = prepared.mediaId;
      expect(prepareResponse.status).toBe(201);

      const uploadResponse = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "image/png" },
        body: file
      });
      expect(uploadResponse.ok).toBe(true);

      const completeResponse = await fetch(`${mediaUrl}/media/${encodeURIComponent(mediaId)}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": mediaApiKey },
        body: JSON.stringify({ size: file.byteLength })
      });
      const completed = await responseJson(completeResponse) as { media: { id: string; status: string; url: string } };
      expect(completed.media).toMatchObject({ id: mediaId, status: "READY" });

      const listResponse = await fetch(`${mediaUrl}/media?resourceType=project&resourceId=${encodeURIComponent(projectId)}`, {
        headers: { "x-api-key": mediaApiKey }
      });
      const listed = await responseJson(listResponse) as { media: Array<{ id: string; url: string }> };
      expect(listed.media).toHaveLength(1);
      expect(listed.media[0]?.id).toBe(mediaId);

      const downloadResponse = await fetch(listed.media[0]!.url);
      expect(downloadResponse.ok).toBe(true);
      expect(new Uint8Array(await downloadResponse.arrayBuffer())).toEqual(file);
    } finally {
      if (mediaId) {
        const deleteResponse = await fetch(`${mediaUrl}/media/${encodeURIComponent(mediaId)}`, {
          method: "DELETE",
          headers: { "x-api-key": mediaApiKey }
        });
        expect(deleteResponse.status).toBe(204);
      }
    }
  });
});
