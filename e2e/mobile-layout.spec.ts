import { expect, test } from "@playwright/test";

const authenticatedPages = [
  "/",
  "/profil",
  "/projekter",
  "/klatrere",
  "/sessioner",
  "/klatresteder",
  "/steder",
  "/indstillinger",
];

test("de primære moduler passer på en smal telefon", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("test@boulde.local");
  await page.getByLabel("Adgangskode", { exact: true }).fill("Test1234!");
  await page.getByRole("button", { name: "Log ind", exact: true }).click();
  await expect(page).toHaveURL("/");

  for (const path of authenticatedPages) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} har vandret overflow`).toBeLessThanOrEqual(1);
    await expect(page.getByRole("navigation", { name: "Mobilnavigation" })).toBeInViewport();
  }
});

test("login og oprettelse passer på en smal telefon", async ({ context, page }) => {
  await context.clearCookies();
  await page.setViewportSize({ width: 320, height: 568 });
  for (const path of ["/login", "/opret"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} har vandret overflow`).toBeLessThanOrEqual(1);
  }
});

test("vælg projektbillede åbner telefonens filvælger", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("test@boulde.local");
  await page.getByLabel("Adgangskode", { exact: true }).fill("Test1234!");
  await page.getByRole("button", { name: "Log ind", exact: true }).click();
  await page.goto("/projekter");

  await page.getByRole("button", { name: /^(Nyt projekt|Opret dit første projekt)$/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Opret projekt" });
  const fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByLabel("Vælg projektbillede").click();
  const fileChooser = await fileChooserPromise;

  expect(fileChooser.isMultiple()).toBe(false);
});

test("billedeknappen i dashboardets opslagspopup åbner filvælgeren", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("test@boulde.local");
  await page.getByLabel("Adgangskode", { exact: true }).fill("Test1234!");
  await page.getByRole("button", { name: "Log ind", exact: true }).click();

  await page.getByRole("button", { name: "Opret opslag" }).last().click();
  const dialog = page.getByRole("dialog", { name: "Opret opslag" });
  const fileChooserPromise = page.waitForEvent("filechooser");
  await dialog.getByLabel("Vælg billede til opslag").click();
  const fileChooser = await fileChooserPromise;

  expect(fileChooser.isMultiple()).toBe(false);
});
