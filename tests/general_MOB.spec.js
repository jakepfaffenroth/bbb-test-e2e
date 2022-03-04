const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: true });

    // test.beforeEach(async ({ page }) => {});

    test.only("Check burger menu", async ({ page }) => {
      const burger = page.locator("button.menuBurger");
      const menuLinks = page.locator("[data-test=categoriesLink]");
      await burger.click();

      expect(menuLinks.first()).toBeVisible();
    });
  });
}
