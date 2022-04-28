const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/pdp.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: false });

    // test.beforeEach(async ({ page }) => {});

    // https://bedbathandbeyond.atlassian.net/browse/PP-3466
    test("Check content order ", async ({ page }) => {
      test.slow();

      const prodDets = "#prodInfo";
      const featSpecs = ".featuresSpecCont";
      const collectionDets = "#collectionChildSlider";
      const FBT = "#bundleParent";
      const accessories = "#accessories";
      const carousels =
        "#likeSolarSlider4star, #likeSolarSliderLoveThese, #likeSolarSliderAlsoLike";
      const compCharts = "#productTable";
      const manufContent = "#webCollageCont:not([hidden])";
      const shippingPols = "#shippingMessageCont";

      // This array defines the order of sections
      const allEls = [
        prodDets,
        featSpecs,
        collectionDets,
        FBT,
        accessories,
        carousels,
        compCharts,
        manufContent,
        shippingPols,
      ];

      let prevEl = "#first";
      let prevOffset = 0;

      // If on mobile, the details accordion needs to be opened
      const detailsAccord = page.locator(
        '.accordWrap21:not(accExpanded) > [aria-label="Open details"]:visible'
      );
      if (await detailsAccord.count()) {
        detailsAccord.click();
        await page.waitForSelector("#prodInfo:visible");
      }

      for await (const selector of allEls) {
        // Get the first element found instead of all matches (because there are multiple recommendationc arousels, but they're all together)
        const el = page.locator(selector).first();

        if ((await el.count()) && (await el.isVisible())) {
          // $eval runs the callback in the the automated browser window itself instead of in the test runner. It receives the element(s) found with the selector as the argument
          let offset = await page.$eval(
            selector,
            (el) => el.getBoundingClientRect().top
          );

          // For some reason #prodInfo section sometimes has negative offset. But it's always first so just make sure it's positive so the test doesn't fail
          if (selector == "#prodInfo" && offset < 0) offset = offset * -1;

          expect
            .soft(
              offset > prevOffset,
              `Expected ${selector} to be below ${prevEl}.
              ${selector} offset: ${offset}
              ${prevEl} offset: ${prevOffset}`
            )
            .toBeTruthy();
          
          // update values for next one
          prevEl = selector;
          prevOffset = offset;
        } else {
        }
      }
    });
  });
}
