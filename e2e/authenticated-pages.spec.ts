import { expect, test } from "@playwright/test";
import neo4j from "neo4j-driver";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const user = {
  name: "E2E Klatrer",
  username: `e2e_${runId.replace(/-/g, "_")}`.slice(0, 24),
  location: "København",
  email: `e2e-${runId}@boulde.local`,
  password: "E2e-hemmelig-123",
};

test.afterAll(async () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "neo4j://localhost:7687",
    neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"),
  );
  try {
    await driver.executeQuery(
      "MATCH (u:User {email: $email}) DETACH DELETE u",
      { email: user.email },
      { database: process.env.NEO4J_DATABASE || "neo4j", routing: "WRITE" },
    );
  } finally {
    await driver.close();
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
