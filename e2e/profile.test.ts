import { test, expect, type Page } from "@playwright/test";

// Helper to register and sign in a test user
async function registerAndSignIn(page: Page, locale = "en") {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-profile-${unique}@test.com`;
  const password = "TestPass123";

  // Register (auto-signs-in after successful registration)
  await page.goto(`/${locale}/sign-up`);
  await page.locator("#name").fill("Profile Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.locator("#sign-up-submit").click();

  // Wait for redirect to dashboard (registration now auto-signs-in)
  await page.waitForURL(`**/${locale}/dashboard`);

  return { email, password };
}

test.describe("Profile Page — Name & Password", () => {
  let credentials: { email: string; password: string };

  test.beforeEach(async ({ page }) => {
    credentials = await registerAndSignIn(page);
    // Navigate to profile page
    await page.goto("/en/profile");
    await page.waitForLoadState("networkidle");
  });

  test("should display profile form with user data", async ({ page }) => {
    // Name field should have the registered name
    await expect(page.locator("#name")).toHaveValue("Profile Tester");
    // Email field should be disabled and show the registered email
    await expect(page.locator("#email")).toBeDisabled();
    await expect(page.locator("#email")).toHaveValue(credentials.email);
    // Both buttons should be visible
    await expect(page.getByText("Update Profile")).toBeVisible();
    await expect(page.getByText("Change Password")).toBeVisible();
  });

  test("should update name successfully", async ({ page }) => {
    // Clear and type new name
    await page.locator("#name").fill("Updated Name");
    // Click Update Profile
    await page.getByText("Update Profile").click();
    // Wait for success toast
    await expect(page.getByText("Profile updated successfully")).toBeVisible({ timeout: 10000 });
    // Name in the header should also update after refresh
    await page.reload();
    await expect(page.locator("#name")).toHaveValue("Updated Name");
  });

  test("should show validation error for short name", async ({ page }) => {
    await page.locator("#name").fill("A");
    await page.getByText("Update Profile").click();
    // Should show inline error
    await expect(page.getByText("Name must contain at least 2 characters")).toBeVisible({ timeout: 10000 });
  });

  test("should show error when new password provided without current password", async ({ page }) => {
    // Leave Current Password empty
    await page.locator("#newPassword").fill("newpass12345");
    await page.locator("#confirmNewPassword").fill("newpass12345");
    await page.getByText("Change Password").click();
    // Should show "Password is required" under Current Password field
    await expect(page.getByText("Password is required")).toBeVisible({ timeout: 10000 });
  });

  test("should show error when current password provided without new password", async ({ page }) => {
    await page.locator("#password").fill("somepassword");
    // Leave New Password empty
    await page.getByText("Change Password").click();
    // Should show "New password is required" under New Password field
    await expect(page.getByText("New password is required")).toBeVisible({ timeout: 10000 });
  });

  test("should show error when new passwords do not match", async ({ page }) => {
    await page.locator("#password").fill(credentials.password);
    await page.locator("#newPassword").fill("newpass12345");
    await page.locator("#confirmNewPassword").fill("different123");
    await page.getByText("Change Password").click();
    // Should show "Passwords do not match"
    await expect(page.getByText("Passwords do not match")).toBeVisible({ timeout: 10000 });
  });

  test("should show error when current password is wrong", async ({ page }) => {
    await page.locator("#password").fill("wrongpassword123");
    await page.locator("#newPassword").fill("newpass12345");
    await page.locator("#confirmNewPassword").fill("newpass12345");
    await page.getByText("Change Password").click();
    // Should show "Invalid current password"
    await expect(page.getByText("Invalid current password")).toBeVisible({ timeout: 10000 });
  });

  test("should change password successfully and login with new password", async ({ page }) => {
    const newPassword = "NewSecurePass456";

    // Change password
    await page.locator("#password").fill(credentials.password);
    await page.locator("#newPassword").fill(newPassword);
    await page.locator("#confirmNewPassword").fill(newPassword);
    await page.getByText("Change Password").click();

    // Wait for success toast
    await expect(page.getByText("Password changed successfully")).toBeVisible({ timeout: 10000 });

    // Sign out
    await page.locator("#user-nav-trigger").click();
    await page.locator("#nav-sign-out").click();
    await page.waitForURL(/\/(uk|en)(\/sign-in)?$/);

    // Sign in with the NEW password
    await page.goto("/en/sign-in");
    await page.locator("#email").fill(credentials.email);
    await page.locator("#password").fill(newPassword);
    await page.locator("#sign-in-submit").click();
    await page.waitForURL("**/en/dashboard");

    // Verify we're logged in
    await expect(page.locator("#user-nav-trigger")).toBeVisible();
  });
});
