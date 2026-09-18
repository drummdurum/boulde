import { expect, test } from "@playwright/test";
import neo4j from "neo4j-driver";

test("tilføjer og udskifter profilbillede og baggrundsbillede", async ({ page }) => {
  test.setTimeout(120_000);
  page.setDefaultTimeout(15_000);
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const email = `profile_${runId}@boulde.local`;
  const images = [
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAQAAABeK7cBAAAADUlEQVR42mP8z8BQDwAFgQIAK9Y7NwAAAABJRU5ErkJggg==", "base64"),
  ];
  const mediaIds = new Set<string>();
  let previousAvatar: string | undefined; let previousCover: string | undefined;
  try {
    const registration = await page.request.post("/api/auth/register", { data: { name: "Profiltest", username: `pr_${runId}`.slice(0, 24), location: "Aarhus", email, password: "Profiltest-123!" }, timeout: 30_000 });
    expect(registration.status(), await registration.text()).toBe(201);
    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: "Profil", exact: true })).toBeVisible();
    for (let version = 0; version < 2; version++) {
      await page.getByRole("button", { name: "Redigér profil", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Redigér profil" });
      await expect(dialog).toBeVisible();
      const bio = `Min klatreprofil ${version}`;
      const description = dialog.getByRole("textbox", { name: "Beskrivelse", exact: true });
      await expect(description).toBeEditable();
      await description.fill(bio);
      await expect(description).toHaveValue(bio);
      await dialog.getByLabel("Profilbillede", { exact: true }).setInputFiles({ name: "profil.png", mimeType: "image/png", buffer: images[version] });
      await dialog.getByLabel("Baggrundsbillede", { exact: true }).setInputFiles({ name: "baggrund.png", mimeType: "image/png", buffer: images[1 - version] });
      const savedResponse = page.waitForResponse(response => response.url().endsWith("/api/profile") && response.request().method() === "PATCH");
      await dialog.getByRole("button", { name: "Gem profil", exact: true }).click();
      const response = await savedResponse;
      const result = await response.json();
      if (result.user?.avatar) mediaIds.add(result.user.avatar.split("/").pop());
      if (result.user?.coverImage) mediaIds.add(result.user.coverImage.split("/").pop());
      expect(response.status(), JSON.stringify(result)).toBe(200);
      expect(result.user.avatar).toMatch(/^\/api\/profile\/[^/]+\/media\/[a-f0-9]{24}$/);
      expect(result.user.coverImage).toMatch(/^\/api\/profile\/[^/]+\/media\/[a-f0-9]{24}$/);
      if (version > 0) {
        expect(result.user.avatar).not.toBe(previousAvatar);
        expect(result.user.coverImage).not.toBe(previousCover);
      }
      previousAvatar = result.user.avatar; previousCover = result.user.coverImage;
      await expect(dialog).toBeHidden();
      await page.reload();
      await expect(page.getByText(bio, { exact: true })).toBeVisible();
      for (const [url, bytes] of [[result.user.avatar, images[version]], [result.user.coverImage, images[1 - version]]] as [string, Buffer][]) {
        const downloaded = await page.request.get(url);
        expect(downloaded.status(), await downloaded.text()).toBe(200);
        expect(downloaded.headers()["content-type"]).toContain("image/png");
        expect(await downloaded.body()).toEqual(bytes);
        const displayed = page.locator(`main img[src="${url}"]`);
        await expect(displayed).toHaveCount(1);
        await expect(displayed).toBeVisible();
        await expect.poll(() => displayed.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
    }
  } finally {
    try {
      for (const id of Array.from(mediaIds)) {
        const deletion = await fetch(`${(process.env.MEDIA_SERVICE_URL || "http://localhost:3102").replace(/\/+$/, "")}/media/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-api-key": process.env.MEDIA_SERVICE_API_KEY || "local-media-development-key" }, signal: AbortSignal.timeout(10_000) });
        expect([204, 404]).toContain(deletion.status);
      }
    } finally {
      const driver = neo4j.driver(process.env.NEO4J_URI || "neo4j://localhost:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"));
      try { await driver.executeQuery("MATCH (u:User {email: $email}) DETACH DELETE u", { email }, { database: process.env.NEO4J_DATABASE || "neo4j", routing: "WRITE" }); }
      finally { await driver.close(); }
    }
  }
});
