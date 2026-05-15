import { test, expect, type Page } from "@playwright/test";

async function registerAndSignIn(page: Page, locale = "en") {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-dashboard-${unique}@test.com`;
  const password = "TestPass123";
  const name = "Dashboard Tester";

  await page.goto(`/${locale}/sign-up`);
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("#sign-up-submit").click();

  await page.waitForURL(`**/${locale}/dashboard`);

  return { email, password, name };
}

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("should display welcome message with user name", async ({ page }) => {
    await expect(page.getByText("Welcome back, Dashboard Tester!")).toBeVisible();
  });

  test("should display stats cards", async ({ page }) => {
    await expect(page.getByText("Total Boards", { exact: true })).toBeVisible();
    await expect(page.getByText("Assigned Tasks", { exact: true })).toBeVisible();
    await expect(page.getByText("Upcoming Deadlines", { exact: true })).toBeVisible();
    await expect(page.getByText("High Priority", { exact: true })).toBeVisible();
  });

  test("should display main sections", async ({ page }) => {
    await expect(page.getByText("My Tasks", { exact: true })).toBeVisible();
    await expect(page.getByText("Recent Activity", { exact: true })).toBeVisible();
    await expect(page.getByText("Favorite Boards", { exact: true })).toBeVisible();
  });

  test("should show empty state for tasks and boards", async ({ page }) => {
    await expect(page.getByText("You don't have any assigned tasks yet", { exact: true })).toBeVisible();
    await expect(page.getByText("You don't have any favorite boards yet", { exact: true })).toBeVisible();
  });

  test("should create a board and show it in activity", async ({ page }) => {
    // Click create board button
    await page.locator("#create-board-trigger").first().click();
    await page.locator("#title").fill("E2E Test Board");
    // Click submit button in dialog
    await page.locator("#create-board-submit").click();

    // Wait for the board page to load by checking for the title
    await expect(page.getByRole("heading", { name: "E2E Test Board" })).toBeVisible({ timeout: 10000 });

    // Go back to dashboard
    await page.goto("/en/dashboard");
    await page.reload(); // Ensure fresh data

    // Check activity log
    const activityItem = page.locator("div.group.relative.pl-6").first();
    await expect(activityItem).toContainText("created", { timeout: 10000 });
    await expect(activityItem).toContainText("board");
    await expect(activityItem).toContainText("E2E Test Board");
  });
});
