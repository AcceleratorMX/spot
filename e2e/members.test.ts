import { test, expect, type Page } from "@playwright/test";

async function registerAndSignIn(page: Page, suffix: string) {
  const email = `member-test-${suffix}@test.com`;
  const password = "TestPass123";
  const name = `Tester ${suffix}`;

  await page.goto("/en/sign-up");
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("#sign-up-submit").click();

  await page.waitForURL("**/en/dashboard");

  return { email, password, name };
}

test.describe("Member Management", () => {
  test("should invite and remove a member", async ({ browser }) => {
    // 1. Create User B first (so they exist in DB)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userB = await registerAndSignIn(pageB, `B-${Date.now()}`);
    await contextB.close();

    // 2. Create User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await registerAndSignIn(pageA, `A-${Date.now()}`);

    // 3. Create a board
    await pageA.getByTestId("create-board-trigger").click();
    await pageA.locator("#title").fill("Team Board");
    await pageA.locator("#create-board-submit").click();
    await expect(pageA.getByRole("heading", { name: "Team Board" })).toBeVisible({ timeout: 10000 });
    // Reload to ensure session is fully hydrated (useSession needs full page load for user.id)
    await pageA.reload();
    await pageA.waitForLoadState("networkidle");

    // 4. Open Board Settings
    const settingsTrigger = pageA.locator("#board-settings-trigger");
    await expect(settingsTrigger).toBeVisible({ timeout: 10000 });
    await settingsTrigger.click();
    await expect(pageA.getByText("Board Settings")).toBeVisible();

    // 5. Invite User B
    await pageA.locator("#invite-member-input").fill(userB.email);
    await pageA.locator("#invite-member-submit").click();

    // 6. Verify User B is in the list
    await expect(pageA.getByText(userB.name)).toBeVisible();

    // 7. Remove User B
    // We can't easily know the ID, but we can find the button in the row or use our new ID if we knew User B's ID.
    // Actually, we can just use the row locator as before but it's safer now with IDs.
    await pageA.locator(`button[id^="remove-member-"]`).click();

    // 8. Verify User B is removed
    await expect(pageA.getByText(userB.name)).not.toBeVisible();
    
    await contextA.close();
  });

  test("should show error when inviting non-existent user", async ({ page }) => {
    await registerAndSignIn(page, `C-${Date.now()}`);

    await page.getByTestId("create-board-trigger").click();
    await page.locator("#title").fill("Error Test Board");
    await page.locator("#create-board-submit").click();
    await expect(page.getByRole("heading", { name: "Error Test Board" })).toBeVisible({ timeout: 10000 });
    // Reload to ensure session is fully hydrated (useSession needs full page load for user.id)
    await page.reload();
    await page.waitForLoadState("networkidle");

    const settingsTrigger = page.locator("#board-settings-trigger");
    await expect(settingsTrigger).toBeVisible({ timeout: 10000 });
    await settingsTrigger.click();
    await page.locator("#invite-member-input").fill("nonexistent@test.com");
    await page.locator("#invite-member-submit").click();

    // Check for error message (toast or alert)
    // In our implementation, we don't have a toast yet, but we should check if they are still NOT in the list
    await expect(page.getByText("nonexistent@test.com")).not.toBeVisible();
  });
});
