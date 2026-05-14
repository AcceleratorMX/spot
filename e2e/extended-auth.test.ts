import { test, expect } from "@playwright/test";

test.describe("Extended Auth Flow", () => {
  test("should navigate to forgot password page", async ({ page }) => {
    await page.goto("/en/sign-in");
    await page.click('a[href*="forgot-password"]');
    await expect(page).toHaveURL(/.*\/forgot-password/);
    // Verify the page title is visible (use getByText for strict matching)
    await expect(page.getByText("Forgot Password?").first()).toBeVisible();
  });

  test("should submit forgot password form and show confirmation", async ({ page }) => {
    await page.goto("/en/forgot-password");
    // Fill in a valid-format email (the server returns success for any email
    // to prevent user enumeration, even if the email doesn't exist in the DB)
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button[type="submit"]');
    // Wait for the success message ("reset email sent" green notification)
    await expect(page.locator('[class*="bg-green"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("should navigate to new password page from URL", async ({ page }) => {
    await page.goto("/en/new-password?token=some-token");
    // Verify the page title "Reset Password" is visible
    await expect(page.getByText("Reset Password").first()).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });
});
