const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    // test.beforeEach(async ({ page }) => {});

    test("Search Color", async ({ page }) => {
      await utils.search(page, "blue");

      // Locate elements, this locator points to a list.
      await page.pause();
      await page.locator("#plpListInner .prodCard").first().waitFor();
      const prodCards = page.locator("#plpListInner .prodCard");
      const cardCount = await prodCards.count();
      let blueCount = 0;
      for (let i = 0; i < cardCount; ++i) {
        if (/blue|navy/i.test(await prodCards.nth(i).textContent())) {
          blueCount++;
        }
      }
      // Arbitrary 40% of product cards should have "blue" in them?
      expect(
        blueCount / cardCount,
        `Only ${blueCount} prod. card(s) have "blue" in them`
      ).toBeGreaterThan(0.4);

      // console.log(await prodCards.nth(i).textContent());
      // await expect(page.locator("#plpListInner")).toHaveText(/in blue/i);

      // const cardFacet = page
      //   .locator(`.prodCard:has(.facet:text-matches("blue|navy", "i"))`)
      //   .first();
      // const colorInCard = await cardFacet.innerText();
      // await cardFacet.click();
      // const defaultFacet = await page
      //   .locator(".colorSwatches button.active")
      //   .getAttribute("aria-label");

      // const re = new RegExp(colorInCard, "i");
      // expect(defaultFacet).toMatch(re);
    });
  });
}
