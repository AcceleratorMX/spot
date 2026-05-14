import { test, expect, type Page } from "@playwright/test";

// Helper to register and sign in a test user
async function registerAndSignIn(page: Page, locale = "en") {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-dep-${unique}@test.com`;
  const password = "TestPass123";

  // Register
  await page.goto(`/${locale}/sign-up`);
  await page.locator("#name").fill("Dependency Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("#sign-up-submit").click();

  // Wait for redirect to sign-in
  await page.waitForURL(`**/${locale}/sign-in`);

  // Sign in
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#sign-in-submit").click();

  // Wait for redirect to dashboard
  await page.waitForURL(`**/${locale}/dashboard`);
  await expect(page.locator("#user-nav-trigger")).toBeVisible();
}

test.describe("Task Dependencies and Graph", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndSignIn(page);
  });

  test("should create dependency and verify symmetrical audit logs", async ({ page }) => {
    test.setTimeout(60000); // This test performs many steps — increase timeout to 60s
    // 1. Setup: Board, Column, and Two Tasks
    await page.locator("#sidebar-nav-boards").click();
    await page.waitForURL("**/boards");
    
    await page.locator("#create-board-trigger").first().click();
    await page.locator("#title").fill("Dependency Test Board");
    // Give a small delay for the dialog to settle on CI
    await page.waitForTimeout(500);
    await page.locator("#create-board-submit").click();
    
    // Wait for dialog to close
    await expect(page.locator("#create-board-submit")).toBeHidden();

    await page.getByText("Dependency Test Board").first().click();
    await page.waitForURL(/\/boards\/[a-z0-9]+/);
    await page.waitForLoadState("networkidle");
    
    // Add Column
    await page.getByText("Add Column").first().click();
    await page.locator("#title").fill("To Do");
    await page.waitForTimeout(500);
    await page.locator("#create-column-submit").click();
    await expect(page.locator("#create-column-submit")).toBeHidden();

    // Add Task 1 (Prerequisite)
    await page.getByText("Add Task").first().click();
    await page.locator("#title").fill("Prerequisite Task");
    await page.waitForTimeout(500);
    await page.locator("#create-task-submit").click();
    await expect(page.locator("#create-task-submit")).toBeHidden();
    
    // Add Task 2 (Dependent)
    await page.getByText("Add Task").first().click();
    await page.locator("#title").fill("Dependent Task");
    await page.waitForTimeout(500);
    await page.locator("#create-task-submit").click();
    await expect(page.locator("#create-task-submit")).toBeHidden();

    // Reload to ensure all tasks are in the server-rendered data (allTasks prop)
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 2. Add Dependency — open Dependent Task details dialog
    await page.getByText("Dependent Task").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Scroll the dialog to make the dependency selector visible
    // The dialog has max-h-[90vh] overflow-y-auto, and dependency section is below many fields
    const trigger = page.locator("#dependency-select-trigger");
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    // Select the Prerequisite Task from options (Radix Select uses role="option")
    await page.getByRole("option", { name: "Prerequisite Task" }).click();

    // Wait for the dependency to be saved and activity refreshed
    await page.waitForTimeout(1000);

    // Verify it's added in UI (dependency badge inside the dialog)
    await expect(page.getByRole("dialog").getByText("Prerequisite Task").first()).toBeVisible();

    // 3. Verify Audit Log in Dependent Task
    // Translation: "Dependency added: {title}" → "Dependency added: Prerequisite Task"
    // Rendered with "• " prefix in activity-history
    await expect(page.getByText(/Dependency added.*Prerequisite Task/)).toBeVisible({ timeout: 10000 });

    // 4. Verify Audit Log in Prerequisite Task
    await page.keyboard.press("Escape"); // Close dialog
    await page.waitForTimeout(500);
    await page.getByText("Prerequisite Task").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Translation: "Became prerequisite for: {title}" → "Became prerequisite for: Dependent Task"
    await expect(page.getByText(/prerequisite for.*Dependent Task/i)).toBeVisible({ timeout: 10000 });

    // 5. Verify Graph View
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    // The Graph button is a <button> rendered in board-view.tsx
    await page.getByRole("button", { name: "Graph" }).click();
    
    // Wait for graph to initialize (React Flow needs a container with dimensions)
    await page.waitForTimeout(2000);

    // Verify the graph panel is visible with expected content
    // The panel text is "Interactive Graph" (CSS uppercase makes it visually all-caps, but DOM text is title case)
    await expect(page.getByText("Interactive Graph")).toBeVisible({ timeout: 10000 });
    
    // Check "Magic Layout" button presence
    await expect(page.getByText("Magic Layout")).toBeVisible();

    // Verify that React Flow rendered task nodes (they contain task titles)
    // React Flow wraps custom nodes in divs with class "react-flow__node" and data-id attributes
    await expect(page.locator(".react-flow__node").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".react-flow__node")).toHaveCount(2, { timeout: 10000 });

    // 6. Delete Dependency via Dialog (back to Kanban for easier clicking)
    await page.getByRole("button", { name: "Kanban" }).click();
    await page.waitForTimeout(500);
    await page.getByText("Dependent Task").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Scroll to make dependency badges visible
    const depTrigger = page.locator("#dependency-select-trigger");
    await depTrigger.scrollIntoViewIfNeeded();
    
    // Click the X button on the dependency badge
    // The badge is a <div> containing "Prerequisite Task" text and a <button> with X icon
    // Find the container div that has the Prerequisite Task text and click its button
    const depBadge = page.getByRole("dialog").locator("div").filter({ hasText: /^Prerequisite Task$/ }).first();
    await depBadge.locator("button").click();

    // Verify audit log for removal
    // Translation: "Dependency removed: {title}" → "Dependency removed: Prerequisite Task"
    await expect(page.getByText(/Dependency removed.*Prerequisite Task/)).toBeVisible({ timeout: 10000 });
  });
});
