import { test, expect, type Page } from "@playwright/test";

async function registerAndSignIn(page: Page) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-lifecycle-${unique}@test.com`;
  const password = "TestPass123";

  await page.goto("/en/sign-up");
  await page.locator("#name").fill("Lifecycle Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("#sign-up-submit").click();

  await page.waitForURL("**/en/dashboard");
}

test.describe("Board Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("full flow: create board, add columns, add tasks, update task, delete board", async ({ page }) => {
    // 1. Create Board
    await page.goto("/en/boards");
    await page.getByTestId("create-board-trigger").first().click();
    await page.locator("#title").fill("Lifecycle Board");
    await page.locator("#description").fill("Testing the full flow");
    await page.locator("#create-board-submit").click();

    // Should redirect to the new board
    await page.waitForURL(/\/en\/boards\/[a-z0-9]+/);
    await expect(page.getByText("Lifecycle Board")).toBeVisible();

    // 2. Add Columns
    await page.locator("#add-column-trigger").click();
    await page.locator("#title").fill("Todo");
    await page.locator("#create-column-submit").click();
    await expect(page.getByText("Todo")).toBeVisible();

    await page.locator("#add-column-trigger").click();
    await page.locator("#title").fill("Done");
    await page.locator("#create-column-submit").click();
    await expect(page.getByText("Done")).toBeVisible();

    // 3. Add Tasks
    const todoColumn = page.locator("[data-testid='column']").filter({ hasText: "Todo" });
    await todoColumn.locator("#add-task-trigger").click();
    await page.locator("#title").fill("Test Task 1");
    await page.locator("#create-task-submit").click();
    await expect(page.getByText("Test Task 1")).toBeVisible();

    // 4. Update Task Details
    await page.getByText("Test Task 1").click();
    await expect(page.getByTestId("task-details-dialog")).toBeVisible();
    await page.locator("#description").fill("Task description updated");
    
    // Wait for auto-save (it has 800ms debounce)
    await page.waitForTimeout(1500);
    await expect(page.getByText("All changes saved")).toBeVisible();
    
    // Close dialog
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("task-details-dialog")).toBeHidden();

    // 5. Delete Board via Settings
    await page.locator("#board-settings-trigger").click();
    await page.locator("#delete-board-button").click();
    await page.locator("#confirm-button").click();

    // Should redirect back to boards
    await page.waitForURL("**/en/boards");
    await expect(page.getByText("Lifecycle Board")).toBeHidden();
  });
});
