// const { test, expect } = require("@playwright/test");
const { test, expect, ...utils } = require("../utils");
const homepages = require("../json/homePages.json");
// const setup = require("../setup");

for (const concept in homepages) {
  test.describe.parallel("Contenstack: " + concept, () => {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url: homepages[concept] });
    });
    test("Loads modules", async ({ page }) => {
      const count = await page.locator("section").count();
      expect(count).toBeGreaterThan(0);
    });
  });
}
