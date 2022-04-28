const { test, expect, utils, plpUtils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/plpATC.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: false });

    test.beforeEach(async ({ page }) => {
      test.slow();
    });

    test("ATC #smoke", async ({ page }) => {
      await page.locator("#plpListInner").scrollIntoViewIfNeeded();
      await page
        .locator("#plpListInner div[role='list']")
        .waitFor({ timeout: 0 });
      const selectedCard = await utils.getRandElement({
        page,
        // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
        selector:
          '.prodCard:has(.plpAtc:text-matches("Add to Cart", "i"):visible)',
      });

      test.skip(
        selectedCard == "NONE_FOUND",
        "No prodCards found with ATC btn."
      );

      const cartCount = page.locator("#cartCount");
      const cartCountBefore = Number(await cartCount.textContent());

      await selectedCard
        .locator('.plpAtc:text-matches("Add to Cart", "i"):visible')
        .click();
      await page.waitForLoadState("load", { timeout: 60 * 1000 });

      const modalCartWrap = page.locator("#fulfillmentModal, #modalCartWrap");
      const cartError =
        /cartErrorModal/.test(await modalCartWrap.getAttribute("class")) ||
        (await modalCartWrap.locator(".panelAlert:visible").count()) > 0;

      await expect(modalCartWrap).toBeVisible();

      await modalCartWrap.locator("button.modalClose:visible").click();

      await expect(modalCartWrap).toBeHidden();

      test.skip(
        cartError,
        "Error adding to cart, e.g., out of stock or API error."
      );
      const cartCountAfter = Number(await cartCount.textContent());

      expect(cartCountAfter).toEqual(cartCountBefore + 1);
    });
  });
}
