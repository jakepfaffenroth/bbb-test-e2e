const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/search_paginated.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    // test.beforeEach(async ({ page }) => {});

    test(" Should have noindex, nofollow", async ({ page }) => {
      // const robotsValue = await page
      //   .locator(":light head mata[name=robots]")
      //   .getAttribute("content");

      await expect(
        page.locator(":light(head meta[name=robots])")
      ).toHaveAttribute("content", "noindex, nofollow");
    });
  });
}
