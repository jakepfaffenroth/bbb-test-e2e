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
      const collectionDets = "#collectionChildSlider, #x-childProdsList";
      const FBT = "#bundleParent";
      const accessories = "#accessories";
      const carousels =
        "#likeSolarSlider4star, #likeSolarSliderLoveThese, #likeSolarSliderAlsoLike";
      const compCharts = "#productTable";
      const manufContent = "#webCollageCont:not([hidden])";
      const shippingPols = "#shippingMessageCont";

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

      const detailsAccord = page.locator(
        '.accordWrap21:not(accExpanded) > [aria-label="Open details"]:visible'
      );
      if (await detailsAccord.count()) {
        detailsAccord.click();
        await page.waitForSelector("#prodInfo:visible");
      }

      for await (const selector of allEls) {
        const el = page.locator(selector);
        if ((await el.count()) && (await el.isVisible())) {
          const offset = await page.$eval(
            selector,
            (el) => el.getBoundingClientRect().top
          );

          expect
            .soft(
              offset > prevOffset,
              `Expected ${selector} to be below ${prevEl}.
              ${selector} offset: ${offset}
              ${prevEl} offset: ${prevOffset}`
            )
            .toBeTruthy();
          prevEl = selector;
          prevOffset = offset;
        } else {
        }
      }
    });
  });
}
