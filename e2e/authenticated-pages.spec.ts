import { expect, test } from "@playwright/test";
import { DeleteObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import neo4j from "neo4j-driver";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const user = {
  name: "E2E Klatrer",
  username: `e2e_${runId.replace(/-/g, "_")}`.slice(0, 24),
  location: "København",
  email: `e2e-${runId}@boulde.local`,
  password: "E2e-hemmelig-123",
};
const sessionUser = { ...user, name: "E2E Sessionvært", username: `session_${runId.replace(/-/g, "_")}`.slice(0, 24), email: `e2e-session-${runId}@boulde.local` };
const mediaUser = { ...user, name: "E2E Medievært", username: `media_${runId.replace(/-/g, "_")}`.slice(0, 24), email: `e2e-media-${runId}@boulde.local` };
const storageBucket = process.env.STORAGE_BUCKET || "boulde-media";
const storage = new S3Client({
  region: process.env.STORAGE_REGION || "us-east-1",
  endpoint: process.env.STORAGE_ENDPOINT || "http://127.0.0.1:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "boulde_local",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "boulde_local_password",
  },
});
let uploadedStorageKey: string | undefined;

test.afterAll(async () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "neo4j://localhost:7687",
    neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"),
  );
  try {
    for (const email of [user.email, sessionUser.email, mediaUser.email]) await driver.executeQuery(
      `MATCH (u:User {email: $email})
       OPTIONAL MATCH (u)-[:HOSTS]->(s:ClimbingSession)
       OPTIONAL MATCH (s)<-[:JOINS]-(g:SessionGuest)
       OPTIONAL MATCH (u)-[:WORKS_ON]->(p:Project)
       OPTIONAL MATCH (p)-[:HAS_MEDIA]->(m:ProjectMedia)
       WITH u, collect(DISTINCT s) AS sessions, collect(DISTINCT g) AS guests, collect(DISTINCT p) AS projects, collect(DISTINCT m) AS media
       FOREACH (guest IN guests | DETACH DELETE guest)
       FOREACH (session IN sessions | DETACH DELETE session)
       FOREACH (item IN media | DETACH DELETE item)
       FOREACH (project IN projects | DETACH DELETE project)
       DETACH DELETE u`,
      { email },
      { database: process.env.NEO4J_DATABASE || "neo4j", routing: "WRITE" },
    );
  } finally {
    await driver.close();
    if (uploadedStorageKey) await storage.send(new DeleteObjectCommand({ Bucket: storageBucket, Key: uploadedStorageKey }));
    storage.destroy();
  }
});

test("opretter bruger, logger ind og åbner de beskyttede sider", async ({ page }) => {
  await page.goto("/profil");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/opret");
  await page.getByLabel("Navn", { exact: true }).fill(user.name);
  await page.getByLabel("Brugernavn", { exact: true }).fill(user.username);
  await page.getByLabel(/By/).fill(user.location);
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Adgangskode", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Opret bruger" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Klar til næste problem?" })).toBeVisible();

  await page.getByRole("button", { name: "Log ud" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Adgangskode", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Log ind", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/profil");
  await expect(page.getByRole("heading", { name: "Profil", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: user.name })).toBeVisible();

  await page.goto("/projekter");
  await expect(page.getByRole("heading", { name: "Mine projekter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Du har ingen projekter endnu" })).toBeVisible();

  await page.goto("/klatrere");
  await expect(page.getByRole("heading", { name: "Find klatrere" })).toBeVisible();
  await page.getByLabel("Søg efter klatrere").fill("Test Klatrer");
  const followButton = page.getByRole("button", { name: "Følg Test Klatrer" });
  await followButton.click();
  await expect(page.getByRole("button", { name: "Stop med at følge Test Klatrer" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Stop med at følge Test Klatrer" })).toBeVisible();

  await page.goto("/profil");
  await expect(page.getByText("Følger", { exact: true }).locator("..").getByText("1", { exact: true })).toBeVisible();
});

test("opretter og deler en global session med live tilmelding", async ({ page, browser }) => {
  await page.goto("/opret");
  await page.getByLabel("Navn", { exact: true }).fill(sessionUser.name);
  await page.getByLabel("Brugernavn", { exact: true }).fill(sessionUser.username);
  await page.getByLabel(/By/).fill(sessionUser.location);
  await page.getByLabel("E-mail", { exact: true }).fill(sessionUser.email);
  await page.getByLabel("Adgangskode", { exact: true }).fill(sessionUser.password);
  await page.getByRole("button", { name: "Opret bruger" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/sessioner");
  await page.getByRole("button", { name: "Ny session", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ny session" });
  const sessionTitle = `E2E session ${runId}`;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await dialog.getByLabel("Titel").fill(sessionTitle);
  await dialog.getByLabel("Dato").fill(tomorrow);
  await dialog.getByLabel("Tid").fill("18:30");
  await dialog.getByLabel("Sted").fill("E2E Klatrehal");
  await dialog.getByRole("button", { name: "Opret session og invitér" }).click();

  const sessionCard = page.getByRole("article").filter({ hasText: sessionTitle });
  await expect(sessionCard).toBeVisible();
  await sessionCard.getByRole("link", { name: "Åbn session" }).click();
  await expect(page).toHaveURL(/\/session\/[^/]+$/);
  await expect(page.getByRole("heading", { name: sessionTitle })).toBeVisible();
  const shareUrl = page.url();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await guestPage.goto(shareUrl);
    await expect(guestPage.getByRole("heading", { name: sessionTitle })).toBeVisible();
    await guestPage.getByLabel("Vil du med?").fill("Live Gæst");
    await guestPage.getByRole("button", { name: "Jeg er med" }).click();
    await expect(guestPage.getByText("Du er med!")).toBeVisible();
    await expect(page.getByText("Live Gæst")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "2 deltagere" })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});

test("uploader en projektvideo til objektlageret", async ({ page }) => {
  const videoBytes = Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 105, 115, 111, 109]);
  const projectName = `Video E2E ${runId}`;
  await page.goto("/opret");
  await page.getByLabel("Navn", { exact: true }).fill(mediaUser.name);
  await page.getByLabel("Brugernavn", { exact: true }).fill(mediaUser.username);
  await page.getByLabel(/By/).fill(mediaUser.location);
  await page.getByLabel("E-mail", { exact: true }).fill(mediaUser.email);
  await page.getByLabel("Adgangskode", { exact: true }).fill(mediaUser.password);
  await page.getByRole("button", { name: "Opret bruger" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/projekter");
  await page.getByRole("button", { name: "Opret dit første projekt" }).click();
  const projectDialog = page.getByRole("dialog", { name: "Opret projekt" });
  await projectDialog.getByLabel("Projektnavn").fill(projectName);
  await projectDialog.getByLabel("Sted").fill("Testhallen");
  await projectDialog.getByRole("button", { name: "Opret projekt" }).click();
  await page.getByRole("button", { name: "Nyt forsøg" }).first().click();
  const mediaDialog = page.getByRole("dialog", { name: "Nyt forsøg" });
  await mediaDialog.getByLabel("Vælg video").setInputFiles({ name: "kort-forsøg.mp4", mimeType: "video/mp4", buffer: videoBytes });
  await mediaDialog.getByRole("textbox", { name: /Note/ }).fill("Test af objektlager");
  await mediaDialog.getByRole("button", { name: "Gem forsøg" }).click();
  await expect(page.getByRole("heading", { name: "Delte billeder og videoer" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("video")).toBeVisible();

  const driver = neo4j.driver(
    process.env.NEO4J_URI || "neo4j://127.0.0.1:7687",
    neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"),
  );
  try {
    const result = await driver.executeQuery(
      `MATCH (:User {email: $email})-[:WORKS_ON]->(p:Project {name: $projectName})-[:HAS_MEDIA]->(m:ProjectMedia)
       RETURN p.id AS projectId, p.attempts AS attempts, m.storageKey AS storageKey,
              m.contentType AS contentType, m.size AS size, m.note AS note, m.type AS type`,
      { email: mediaUser.email, projectName },
      { database: process.env.NEO4J_DATABASE || "neo4j" },
    );
    expect(result.records).toHaveLength(1);
    const record = result.records[0];
    uploadedStorageKey = record.get("storageKey");
    expect(record.get("projectId")).toBeTruthy();
    const numberValue = (value: unknown) => neo4j.isInt(value) ? value.toNumber() : Number(value);
    expect(numberValue(record.get("attempts"))).toBe(1);
    expect(record.get("contentType")).toBe("video/mp4");
    expect(numberValue(record.get("size"))).toBe(videoBytes.length);
    expect(record.get("note")).toBe("Test af objektlager");
    expect(record.get("type")).toBe("video");

    const storedObject = await storage.send(new HeadObjectCommand({ Bucket: storageBucket, Key: uploadedStorageKey }));
    expect(storedObject.ContentLength).toBe(videoBytes.length);
    expect(storedObject.ContentType).toBe("video/mp4");

    const mediaResponse = await page.request.get(`/api/projects/${record.get("projectId")}/media`);
    expect(mediaResponse.ok()).toBeTruthy();
    const media = (await mediaResponse.json()).media;
    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({ type: "video", contentType: "video/mp4", note: "Test af objektlager", size: videoBytes.length });
    const download = await page.request.get(media[0].url);
    expect(download.ok()).toBeTruthy();
    expect(await download.body()).toEqual(videoBytes);
  } finally {
    await driver.close();
  }
});

test("modalvinduer kan bruges og lukkes på en telefon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("test@boulde.local");
  await page.getByLabel("Adgangskode", { exact: true }).fill("Test1234!");
  await page.getByRole("button", { name: "Log ind", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Opret opslag" }).click();
  const postDialog = page.getByRole("dialog", { name: "Opret opslag" });
  await expect(postDialog).toBeVisible();
  expect((await postDialog.boundingBox())!.height).toBeLessThanOrEqual(667);
  await postDialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByRole("button", { name: "Luk dialog" })).toBeInViewport();
  await page.getByRole("button", { name: "Luk dialog" }).click();
  await expect(postDialog).toBeHidden();

  await page.goto("/projekter");
  await page.getByRole("button", { name: /^(Nyt projekt|Opret dit første projekt)$/ }).click();
  const projectDialog = page.getByRole("dialog", { name: "Opret projekt" });
  await expect(projectDialog).toBeVisible();
  expect((await projectDialog.boundingBox())!.height).toBeLessThanOrEqual(667);
  await projectDialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(projectDialog.getByRole("button", { name: "Luk" })).toBeInViewport();
  await projectDialog.getByRole("button", { name: "Luk" }).click();
  await expect(projectDialog).toBeHidden();
});
