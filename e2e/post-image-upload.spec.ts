import { expect, test } from "@playwright/test";
import neo4j from "neo4j-driver";

test("gemmer et opslag med billede i media-servicen", async ({ page }) => {
  test.setTimeout(90_000);
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const email = `post_${runId}@boulde.local`;
  const description = `Billedopslag ${runId}`;
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  let mediaId: string | undefined;
  try {
    // APIRequestContext shares session cookies with the browser. Registration
    // is setup for this test; the post and image are submitted through the UI.
    const registration = await page.request.post("/api/auth/register", {
      data: {
        name: "Billedtest",
        username: `p_${runId}`.slice(0, 24),
        location: "København",
        email,
        password: "Billedtest-123!",
      },
      timeout: 30_000,
    });
    const registrationBody = await registration.text();
    expect(registration.status(), `Testbrugeren kunne ikke oprettes: ${registrationBody}`).toBe(201);
    await page.goto("/");
    await expect(page, "Testbrugerens session skal give adgang til forsiden").toHaveURL("/", { timeout: 15_000 });
    await page.getByRole("region", { name: "Seneste på væggen" }).getByRole("button", { name: "Opret opslag", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Opret opslag" });
    await dialog.getByLabel("Hvad vil du dele?").fill(description);
    await dialog.getByLabel("Vælg billede til opslag").setInputFiles({ name: "opslag.png", mimeType: "image/png", buffer: image });
    const responsePromise = page.waitForResponse(response => response.url().endsWith("/api/posts") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Gem opslag" }).click();
    const response = await responsePromise;
    const result = await response.json();
    mediaId = result.post?.image?.split("/").pop();
    expect(response.status(), JSON.stringify(result)).toBe(201);
    expect(result.post.image).toMatch(/^\/api\/posts\/[a-f0-9]{24}\/media\/[a-f0-9]{24}$/);
    await expect(dialog).toBeHidden();
    await page.reload();
    const storedPostCard = page.getByRole("region", { name: "Seneste på væggen" }).getByRole("article").filter({ has: page.locator(`img[src="${result.post.image}"]`) });
    await expect(storedPostCard).toHaveCount(1);
    await expect(storedPostCard).toBeVisible();
    await expect(storedPostCard).toContainText(description);
    const storedPosts = await page.request.get("/api/posts");
    expect(storedPosts.ok()).toBeTruthy();
    expect((await storedPosts.json()).posts).toEqual(expect.arrayContaining([expect.objectContaining({ id: result.post.id, image: result.post.image })]));
    const downloaded = await page.request.get(result.post.image);
    expect(downloaded.status()).toBe(200);
    expect(downloaded.headers()["content-type"]).toContain("image/png");
    expect(await downloaded.body()).toEqual(image);
    const displayedImage = storedPostCard.locator(`img[src="${result.post.image}"]`);
    await expect(displayedImage).toBeVisible();
    await expect.poll(() => displayedImage.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally {
    try {
      if (mediaId) {
        const deletion = await fetch(`${(process.env.MEDIA_SERVICE_URL || "http://localhost:3102").replace(/\/+$/, "")}/media/${encodeURIComponent(mediaId)}`, {
          method: "DELETE",
          headers: { "x-api-key": process.env.MEDIA_SERVICE_API_KEY || "local-media-development-key" },
          signal: AbortSignal.timeout(10_000),
        });
        expect([204, 404]).toContain(deletion.status);
      }
    } finally {
      const driver = neo4j.driver(process.env.NEO4J_URI || "neo4j://localhost:7687", neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"));
      try {
        await driver.executeQuery("MATCH (u:User {email: $email}) OPTIONAL MATCH (u)-[:CREATED]->(p:Post) DETACH DELETE p, u", { email }, { database: process.env.NEO4J_DATABASE || "neo4j", routing: "WRITE" });
      } finally { await driver.close(); }
    }
  }
});
