const { test, expect, utils } = require("../utils");
const pdpExamples = require("../testPages/pdp.json");

for (const example in pdpExamples) {
  const url = pdpExamples[example];
  let shipIt, SDD, pickUp, fulfillmentBtn;

  test.describe.parallel("Fulfillment: " + example, () => {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url });
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
      // await page.waitForLoadState("networkidle");
      // await page.waitForResponse(/cart\/item/i);

      test.fail(
        await page.locator("#modalCartWrap .panelAlert:visible").isVisible(),
        "API error?"
      );

      const cartCountAfter = await utils.getCartCount(page);

      expect(cartCountAfter).toEqual(cartCountBefore + 1);
    });
  });
}
