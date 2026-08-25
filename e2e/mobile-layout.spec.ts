import { expect, test } from "@playwright/test";

const authenticatedPages = ["/", "/profil", "/projekter", "/klatrere"];

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
