const { chromium } = require("@playwright/test");
const colors = require("colors/safe");
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

let isMobile;

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    test.beforeEach(async ({ page }, testInfo) => {
      page.isMobile = testInfo.project?.use?.isMobile;
      isMobile = page.isMobile;
    });

    test("Log in and return to PWA #smoke", async ({ page }) => {
      test.slow();
      const sourcePage = page.url();

      await utils.signIn({ page });
      while (page.url() != sourcePage) {
        await page.goBack();
      }

      const isPWA = await utils.isPwa(page);
      expect(isPWA, "Is not PWA").toBeTruthy();
    });
  });
}
