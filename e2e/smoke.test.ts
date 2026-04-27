import { test, expect } from "@playwright/test";

test("homepage redirects to default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/uk/);
});
