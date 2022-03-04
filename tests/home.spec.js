const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    // test.beforeEach(async ({ page }) => {});

    test("Loads modules", async ({ page }) => {
      const count = await page.locator("section").count();
      expect(count).toBeGreaterThan(0);

      // Look for certain kinds of CS modules
      // May need to update occassionally as the modules used may change
      const modStoryTitle = page.locator("section[id^=modStoryTitle]").first();
      const modGraphicBanner = page
        .locator("section[id^=modGraphicBanner]")
        .first();
      // const modStoryHero = page.locator("section[id^=modStoryHero]").first();

      await Promise.all([
        expect(modStoryTitle).toBeVisible(),
        expect(modGraphicBanner).toBeVisible(),
        // expect(modStoryHero).toBeVisible(),
      ]);
    });
  });
}
