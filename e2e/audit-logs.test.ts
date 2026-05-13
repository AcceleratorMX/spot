import { test, expect, type Page } from "@playwright/test";

// Helper to register and sign in a test user
async function registerAndSignIn(page: Page, locale = "en") {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-audit-${unique}@test.com`;
  const password = "TestPass123";

  // Register
  await page.goto(`/${locale}/sign-up`);
  await page.locator("#name").fill("Audit Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-up-submit").click();

  // Wait for redirect to sign-in
  await page.waitForURL(`**/${locale}/sign-in`);

  // Sign in
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-in-submit").click();

  // Wait for redirect to dashboard and ensure session is active
  await page.waitForURL(`**/${locale}/dashboard`);
  await expect(page.locator("#user-nav-trigger")).toBeVisible();
  // Initials "AT" for "Audit Tester"
  await expect(page.locator("#user-nav-trigger")).toContainText("AT");
}

test.describe("Audit Logs and Activity History", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("should track task creation and auto-saved updates in activity history", async ({ page }) => {
    // 1. Navigate to boards
    await page.locator("#sidebar-nav-boards").click();
    await page.waitForURL(/\/boards/);
    
    // 2. Create a new board (use the trigger button's stable ID)
    await page.locator("#create-board-trigger").first().click();
    await page.locator("#title").fill("Audit Test Board");
    await page.locator("#create-board-submit").click();

    // 3. Click on the created board to open it
    await page.getByText("Audit Test Board").first().click();
    await page.waitForURL(/\/boards\/[a-z0-9]+/);
    await page.waitForLoadState("networkidle");

    // 4. Create a column (note: button text is "Add Column" with capital C)
    await page.getByText("Add Column").first().click();
    await page.locator("#title").fill("To Do");
    await page.locator("#create-column-submit").click();
    await expect(page.getByText("To Do")).toBeVisible();

    // 5. Create a task (note: button text is "Add Task" with capital T)
    await page.getByText("Add Task").first().click();
    await page.locator("#title").fill("Audit Target Task");
    await page.locator("#create-task-submit").click();
    await expect(page.getByText("Audit Target Task")).toBeVisible();

    // 6. Reload to ensure full synchronization of user session and task data
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 7. Open task details
    await page.getByText("Audit Target Task").click();
    
    // Wait for dialog to appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Activity", { exact: true })).toBeVisible();

    // 8. Change description (triggers auto-save with 800ms debounce)
    const descriptionField = page.locator("#description");
    
    // Wait for the field to be enabled (it should be since we are the owner)
    // We use a generous timeout to account for hydration
    await expect(descriptionField).toBeEnabled({ timeout: 20000 });
    
    const description = "New test description for auditing";
    await descriptionField.fill(description);

    // Wait for auto-save status feedback
    await expect(page.getByText("Saving changes...")).toBeVisible();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });

    // 9. Verify audit log entry for the update
    // Activity history renders action text ("updated") and entity type ("task") in separate spans
    // The description change detail renders as: "• Description: --- → New test description..."
    await expect(page.getByText("updated")).toBeVisible();
    await expect(page.getByText(/--- → New test description for auditing/)).toBeVisible();

    // 10. Add a subtask and verify log
    await page.getByPlaceholder("Add subtask...").fill("Initial Subtask");
    // Press Enter to submit the subtask (the input has an onKeyDown handler for Enter)
    await page.getByPlaceholder("Add subtask...").press("Enter");

    await expect(page.getByText("Initial Subtask", { exact: true }).first()).toBeVisible();
    // Subtask audit log renders as: "• Subtask added: Initial Subtask"
    await expect(page.getByText(/Subtask added.*Initial Subtask/)).toBeVisible({ timeout: 10000 });

    // 11. Change priority and verify log
    // Open the Radix Select dropdown by clicking the trigger
    await page.locator("#priority").click();
    // Select option from the Radix Select dropdown (role="option")
    await page.getByRole("option", { name: "High" }).click();

    await expect(page.getByText("Saving changes...")).toBeVisible();
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10000 });
    // Priority change renders as: "• Priority: MEDIUM → HIGH"
    await expect(page.getByText(/MEDIUM → HIGH/)).toBeVisible({ timeout: 10000 });
  });
});
