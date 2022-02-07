const { test, expect, ...utils } = require("../utils");
const plpExamples = require("../json/plpExamples.json");

for (const example in plpExamples) {
  test.describe("PLP", () => {
    // test.beforeAll(async ({ browser }) => {
    //   page = await browser.newPage();
    //   test.slow();
    //   await utils.init({ page, url: plpExamples[example] });
    // });
    test.beforeEach(async ({ page }) => {
      test.slow();
      await utils.init({ page, url: plpExamples[example] });
    });

    test("ATC: " + example, async ({ page }) => {
      const selectedCard = await utils.getRandPlpCard({
        page,
        // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
        selector: '.prodCard:has(.plpAtc:text-matches("Add to Cart", "i"))',
      });

      test.skip(
        selectedCard == "NONE_FOUND",
        "No prodCards found with ATC btn."
      );

      const cartCount = page.locator("#cartCount");
      const cartCountBefore = Number(await cartCount.textContent());

      await selectedCard.locator("text=Add to Cart").click();
      await page.waitForLoadState("load", { timeout: 60 * 1000 });
      await page.waitForTimeout(3000);

      const cartCountAfter = Number(await cartCount.textContent());
      await expect(page.locator(".modalCart")).toBeVisible();
      expect(cartCountAfter).toEqual(cartCountBefore + 1);

      await page.locator("#modalCartWrap button.modalClose").click();
      // await utils.waitAfterPdpSoftNav(page)
    });

    test("Flow: PLP->PDP: " + example, async ({ page }) => {
      // const prodCards = page.locator(".prodCard");

      // await utils.autoScroll(page, 50);

      // const count = await prodCards.count();
      // const selectedCard = prodCards.nth((count * Math.random()) | 0);

      const selectedCard = await utils.getRandPlpCard({ page });
      const cardTitleLocator = selectedCard.locator("a.plpProdTitle");
      // const cardTitle = await cardTitleLocator.innerText();

      page.waitForNavigation();
      await cardTitleLocator.click();

      // await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
      // await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
      // await utils.waitForAmpBody(page);
      await utils.waitAfterPdpSoftNav(page);

      // const body = page.locator("#wmHostPdp body.amp-shadow");
      await expect(page.locator("#wmHostPdp body.amp-shadow")).toBeVisible();
      await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeHidden();
      // await expect(body).toHaveClass(/pdp/i);

      // const pdpTitle = await page.locator("h1").first().innerText();
      // expect(pdpTitle).toEqual(cardTitle);
    });
  });
  // test.afterAll(async () => {
  //   await page.close();
  // });
}
