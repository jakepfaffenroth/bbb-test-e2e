const { test, expect, ...utils } = require("../utils");
const homepages = require("../json/homePages.json");

const { waitForAmpBody, search } = require("../utils");

for (const concept in homepages) {
  test.describe.parallel("Flow: " + concept, () => {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url: homepages[concept] });
      // await search("blue");
    });
    test("Search Color", async ({ page }) => {
      await search(page, "blue");

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
