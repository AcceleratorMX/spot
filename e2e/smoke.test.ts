import { test, expect } from "@playwright/test";

test("homepage redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(uk|en)/);
});
