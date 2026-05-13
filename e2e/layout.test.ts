import { test, expect } from "@playwright/test";

test.describe("Layout and Navigation", () => {
  test.describe("Public pages", () => {
    test("landing page shows SPOT branding and CTA buttons", async ({ page }) => {
      await page.goto("/uk");
      await expect(page.getByRole("heading", { name: /ласкаво просимо/i })).toBeVisible();
      await expect(page.locator("#landing-sign-in")).toBeVisible();
      await expect(page.locator("#landing-sign-up")).toBeVisible();
    });

    test("sign-in page renders correctly", async ({ page }) => {
      await page.goto("/uk/sign-in");
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#sign-in-submit")).toBeVisible();
      await expect(page.locator("#go-to-sign-up")).toBeVisible();
    });

    test("sign-up page renders correctly", async ({ page }) => {
      await page.goto("/uk/sign-up");
      await expect(page.locator("#name")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#sign-up-submit")).toBeVisible();
      await expect(page.locator("#go-to-sign-in")).toBeVisible();
    });

    test("navigates between sign-in and sign-up pages", async ({ page }) => {
      await page.goto("/uk/sign-in");
      await page.locator("#go-to-sign-up").click();
      await expect(page).toHaveURL(/\/uk\/sign-up/);

      await page.locator("#go-to-sign-in").click();
      await expect(page).toHaveURL(/\/uk\/sign-in/);
    });
  });

  test.describe("Protected pages (require auth)", () => {
    test("redirects unauthenticated user from dashboard to sign-in", async ({ page }) => {
      await page.goto("/uk/dashboard");
      await expect(page).toHaveURL(/\/uk\/sign-in/);
    });

    test("redirects unauthenticated user from boards to sign-in", async ({ page }) => {
      await page.goto("/uk/boards");
      await expect(page).toHaveURL(/\/uk\/sign-in/);
    });
  });
});
