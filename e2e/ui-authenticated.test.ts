import { test, expect, type Page } from "@playwright/test";

// Helper to register and sign in a test user
async function registerAndSignIn(page: Page, locale = "en") {
  const unique = Date.now();
  const email = `e2e-ui-${unique}@test.com`;
  const password = "TestPass123";

  // Register
  await page.goto(`/${locale}/sign-up`);
  await page.locator("#name").fill("E2E Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-up-submit").click();

  // Wait for redirect to sign-in
  await page.waitForURL(`**/${locale}/sign-in`);

  // Sign in
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-in-submit").click();

  // Wait for redirect to dashboard
  await page.waitForURL(`**/${locale}/dashboard`);
}

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("sidebar shows navigation items", async ({ page }) => {
    await expect(page.getByTestId("sidebar")).toBeVisible();
    await expect(page.locator("#sidebar-nav-dashboard")).toBeVisible();
    await expect(page.locator("#sidebar-nav-boards")).toBeVisible();
    await expect(page.locator("#sidebar-nav-settings")).toBeVisible();
  });

  test("navigates between pages using sidebar", async ({ page }) => {
    // Navigate to boards
    await page.locator("#sidebar-nav-boards").click();
    await expect(page).toHaveURL(/\/boards/);

    // Navigate to settings
    await page.locator("#sidebar-nav-settings").click();
    await expect(page).toHaveURL(/\/settings/);

    // Navigate back to dashboard
    await page.locator("#sidebar-nav-dashboard").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sidebar collapse and expand", async ({ page }) => {
    // Initially SPOT text should be visible
    await expect(page.getByTestId("sidebar").getByText("SPOT")).toBeVisible();

    // Click collapse toggle (force to bypass dev overlay)
    await page.locator("#sidebar-toggle").click({ force: true });

    // SPOT text should be hidden
    await expect(page.getByTestId("sidebar").getByText("SPOT")).not.toBeVisible();

    // Expand again
    await page.locator("#sidebar-toggle").click({ force: true });

    // SPOT text visible again
    await expect(page.getByTestId("sidebar").getByText("SPOT")).toBeVisible();
  });
});

test.describe("Navbar", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("shows user menu when authenticated", async ({ page }) => {
    await expect(page.locator("#user-nav-trigger")).toBeVisible();
  });

  test("user menu shows sign out option", async ({ page }) => {
    await page.locator("#user-nav-trigger").click();
    await expect(page.locator("#nav-sign-out")).toBeVisible();
  });

  test("sign out redirects to landing page", async ({ page }) => {
    await page.locator("#user-nav-trigger").click();
    await page.locator("#nav-sign-out").click();

    // Should redirect to landing or sign-in
    await page.waitForURL(/\/(uk|en)(\/sign-in)?$/);
  });
});

test.describe("Language Switcher", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page, "en");
  });

  test("switches language from English to Ukrainian", async ({ page }) => {
    // We're on /en/dashboard
    await expect(page).toHaveURL(/\/en\/dashboard/);

    // Open language switcher
    await page.locator("#language-switcher").click();

    // Click Ukrainian
    await page.locator("#language-uk").click();

    // URL should change to /uk/dashboard
    await expect(page).toHaveURL(/\/uk\/dashboard/);
  });
});
