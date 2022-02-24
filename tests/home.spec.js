
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: true });

    test.beforeEach(async ({ page }) => {});

    test("Loads modules", async ({ page }) => {
      const count = await page.locator("section").count();
      expect(count).toBeGreaterThan(0);
    });
  });
}
