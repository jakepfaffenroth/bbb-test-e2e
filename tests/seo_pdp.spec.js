const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/pdp.json"));

/*
  ~~ REUSE PAGES ~~
  This test spec will use one page for each example page, reusing between tests.
*/
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
    let schemaGraph, txt, json;

    test.beforeAll(async ({ baseURL, browser }, testInfo) => {
      Object.assign(testInfo, { testConfig, baseURL });
      page = await start({ browser, testInfo });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      schemaGraph = page.locator("#pdpSchemaGraph");
      txt = await schemaGraph.innerHTML();
      json = JSON.parse(txt);
    });

    test("pdpSchemaGraph JSON", async () => {
      expect
        .soft(txt, "Script tag does not contain valid JSON")
        .toMatch(/^\s+?\{.+\}\s+?$/s);
      expect.soft(json["@context"]).toEqual("https://schema.org/");
      expect(json["@type"]).toEqual("Product");
    });
    test("Product name & description", async () => {
      expect.soft(json.name).toEqual(expect.stringMatching(/.+/));
      expect(json.description).toEqual(expect.stringMatching(/.+/));
    });
    test("img and url", async () => {
      expect.soft(json.image).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.sku).toEqual(expect.stringMatching(/[\d]+/));
    });
    test("Product brand", async () => {
      expect.soft(json.brand).toEqual(
        expect.objectContaining({
          "@type": "Brand",
          name: expect.stringMatching(/.+/),
        })
      );
    });
    test("offers object & availability", async () => {
      expect.soft(json.offers).toEqual(
        expect.objectContaining({
          url: expect.stringMatching(/.+/),
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          availability: expect.stringMatching(/.+/),
        })
      );
    });
    test("Price", async () => {
      if (/discontinued/i.test(json.offers.availability)) {
        expect(json.offers.price).toBeFalsy();
      } else {
        expect(
          /[\d\.]+/.test(json.offers.price) ||
            (/[\d\.]+/.test(json.offers.lowPrice) &&
              /[\d\.]+/.test(json.offers.highPrice))
        ).toBeTruthy();
      }
    });
    test("Rating", async () => {
      expect(json.aggregateRating).toEqual(
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
