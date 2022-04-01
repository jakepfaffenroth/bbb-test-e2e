const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/pdp.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";
  // const url = pdpExamples[example];
  let shipIt, SDD, pickUp, fulfillmentBtn;

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    test.beforeEach(async ({ page }) => {
      shipIt = page.locator('#fullfillSelector div[option="cart"]:visible');
      SDD = page.locator('#fullfillSelector div[option="deliverIt"]:visible');
      pickUp = page.locator('#fullfillSelector div[option="pickItUp"]:visible');
      fulfillmentBtn = page.locator(".fulfillCtaCont button:visible");
    });

    test("ATC", async ({ page }) => {
      await fulfillmentBtn.waitFor();

      if (await shipIt.isVisible()) expect(shipIt).toHaveClass(/active/i);
      if (await SDD.isVisible()) expect(SDD).not.toHaveClass(/active/i);
      if (await pickUp.isVisible()) expect(pickUp).not.toHaveClass(/active/i);

      const cartCountBefore = await utils.getCartCount(page);
      await fulfillmentBtn.click();
      await page.waitForSelector("#modalCartWrap");

      test.fail(
        await page.locator("#modalCartWrap .panelAlert:visible").isVisible(),
        "API error?"
      );

      const cartCountAfter = await utils.getCartCount(page);

      expect(cartCountAfter).toEqual(cartCountBefore + 1);
    });
  });
}
