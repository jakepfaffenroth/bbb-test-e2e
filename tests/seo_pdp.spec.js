const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/pdp.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: false });

    // test.beforeEach(async ({ page }) => {});

    test("PDP structured data", async ({ page }) => {
      const schemaGraph = page.locator("#pdpSchemaGraph");
      const txt = await schemaGraph.innerHTML();

      expect(txt, "Script tag does not contain valid JSON").toMatch(
        /^\s+?\{.+\}\s+?$/s
      );
      // console.log("txt:", txt);
      const json = JSON.parse(txt);

      expect.soft(json["@context"]).toEqual("https://schema.org/");
      expect.soft(json["@type"]).toEqual("Product");
      expect.soft(json.name).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.description).toEqual(expect.stringMatching(/.+/));
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
      expect
        .soft(
          /[\d\.]+/.test(json.offers.price) ||
            (/[\d\.]+/.test(json.offers.lowPrice) &&
              /[\d\.]+/.test(json.offers.highPrice))
        )
        .toBeTruthy();
      expect.soft(json.image).toEqual(expect.stringMatching(/.+/));
      expect.soft(json.sku).toEqual(expect.stringMatching(/[\d]+/));
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
