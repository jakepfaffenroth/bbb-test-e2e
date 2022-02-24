const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/clp.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: true });

    test.beforeEach(async ({ page }) => {});

    test("Fetches cms data", async ({ page }) => {
      await expect(page.locator("body.amp-shadow")).toHaveClass(/CLPv2/i);
      expect(
        await page.locator("body.amp-shadow section").count()
      ).toBeGreaterThan(0);
    });
  });
}
