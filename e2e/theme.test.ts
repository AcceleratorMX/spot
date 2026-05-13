import { test, expect, type Page } from "@playwright/test";

// Helper to register and sign in a test user
async function registerAndSignIn(page: Page) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-theme-${unique}@test.com`;
  const password = "TestPass123";

  await page.goto("/en/sign-up");
  await page.locator("#name").fill("Theme Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-up-submit").click();
  await page.waitForURL("**/en/sign-in");

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-in-submit").click();
  await page.waitForURL("**/en/dashboard");
}

test.describe("Theme Switcher", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("toggles between light and dark theme", async ({ page }) => {
    // Open theme dropdown (in navbar)
    await page.locator("#theme-toggle").click();

    // Click dark theme
    await page.getByRole("menuitem", { name: /dark/i }).click();

    // Check that dark class is on <html>
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Wait for dropdown to fully close
    await expect(page.getByRole("menuitem", { name: /dark/i })).not.toBeVisible();

    // Open theme dropdown again
    await page.locator("#theme-toggle").click();

    // Wait for and click light theme
    const lightItem = page.getByRole("menuitem", { name: /light/i });
    await lightItem.waitFor({ state: "visible" });
    await lightItem.click();

    // Check that dark class is removed
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("persists theme selection after page reload", async ({ page }) => {
    // Set dark theme
    await page.locator("#theme-toggle").click();
    await page.getByRole("menuitem", { name: /dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reload the page
    await page.reload();

    // Dark theme should persist
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
