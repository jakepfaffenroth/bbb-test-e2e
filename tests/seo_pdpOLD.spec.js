const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/pdp.json"));

for (let examplePage of pages) {
  const testConfig = {
    checkVersion: false, // Fail test if Appshell & AMP doc versions mismatch?
    login: false, // Perform login flow prior to running tests?
    watchConsole: false, // Boolean or regex
    examplePage,
    params: "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true",
  };

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    let page;
    test.beforeAll(async ({ baseURL, browser }, testInfo) => {
      test.slow();

      Object.assign(testInfo, { testConfig, baseURL });

      page = await start({ browser, testInfo });
      test.info().annotations.push({
        type: "Test page",
        description: `<a href="${page.url()}">${page.url()}</a>`,
      });
    });

    test.afterAll(async () => {
      await page.close();
    });

    // test.beforeEach(async ({ page }) => {});

    test("PDP structured data", async () => {
      const schemaGraph = page.locator("#pdpSchemaGraph");
      const txt = await schemaGraph.innerHTML();
      const json = JSON.parse(txt);

      expect
        .soft(txt, "Script tag does not contain valid JSON")
        .toMatch(/^\s+?\{.+\}\s+?$/s);
      expect.soft(json["@context"]).toEqual("https://schema.org/");
      expect.soft(json["@type"]).toEqual("Product");
      expect.soft(json.name).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.description).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.image).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.sku).toEqual(expect.stringMatching(/[\d]+/));
      expect.soft(json.brand).toEqual(
        expect.objectContaining({
          "@type": "Brand",
          name: expect.stringMatching(/.+/),
        })
      );
      expect.soft(json.offers).toEqual(
        expect.objectContaining({
          url: expect.stringMatching(/.+/),
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          availability: expect.stringMatching(/.+/),
        })
      );
      if (/discontinued/i.test(json.offers.availability)) {
        expect.soft(json.offers.price).toBeFalsy();
      } else {
        expect
          .soft(
            /[\d\.]+/.test(json.offers.price) ||
              (/[\d\.]+/.test(json.offers.lowPrice) &&
                /[\d\.]+/.test(json.offers.highPrice))
          )
          .toBeTruthy();
      }
      expect.soft(json.aggregateRating).toEqual(
        expect.objectContaining({
          "@type": "AggregateRating",
          ratingValue: expect.stringMatching(/[\d\.]+/),
          reviewCount: expect.stringMatching(/[\d]+/),
          itemReviewed: expect.objectContaining({
            type: "Thing",
            name: expect.stringMatching(/.+/),
          }),
          bestRating: "5",
        })
      );
    });
  });
}
