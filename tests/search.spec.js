const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: true });

    test.beforeEach(async ({ page }) => {});

    test("Search Color", async ({ page }) => {
      await utils.search(page, "blue");

      const card = page.locator(".prodCard .facet").first();
      const colorInCard = await card.innerText();
      await card.click();
      const defaultFacet = await page
        .locator(".colorSwatches button.active")
        .getAttribute("aria-label");

      const re = new RegExp(colorInCard, "i");
      expect(defaultFacet).toMatch(re);
    });
  });
}
