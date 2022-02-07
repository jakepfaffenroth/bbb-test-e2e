const { test, expect, ...utils } = require("../utils");

test.describe("Test CLPv2", () => {
  test.beforeEach(async ({ page }) => {
    const url =
      "https://em02-www.bbbyapp.com/store/category/bedding/10001?wmPwa&web3feo&wmFast";
    await utils.init({ page, url });
    // await setup(page);
    // page.goto(
    //   "https://em02-www.bbbyapp.com/store/category/bedding/10001?wmPwa&web3feo&wmFast"
    // );
    // await waitForAmpBody(page);
  });
  test("Fetches L1 cms data", async ({ page }) => {
    await expect(page.locator("body.amp-shadow")).toHaveClass(/CLPv2/i);
  });
});
