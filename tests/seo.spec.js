const { test, expect, ...utils } = require("../utils");
const pages = require("../json/pageExamples.json");
const pdpExamples = require("../json/pdpExamples.json");

for (const pageType in pages) {
  test.describe.parallel("SEO: " + pageType, function () {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url: pages[pageType] });
    });
    test(`H1 tag: ${pageType}`, async ({ page }) => {
      const h1Locator = page.locator(":light(h1)");
      const count = await h1Locator.count();
      expect(count).toEqual(1);
    });

    test(`Validate #schemaGraph: ${pageType}`, ({ page }) => {
      expect(page.locator("#schemaGraph")).toHaveCount(1);
      if (/search/.test(pageType)) return;
      expect(page.locator("#schemaGraph")).toContainText("Breadcrumb");
    });
  });
}

for (const example in pdpExamples) {
  test.describe("Structured data: " + example, async () => {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url: pdpExamples[example] });
    });
    test("Product name in schema equals page title", async ({ page }) => {
      test.fixme();
      const schemaGraph = page.locator("#schemaGraph");
      await expect(schemaGraph).toContainText("Product");
      let schemaJson = JSON.parse(
        await page.locator("#schemaGraph").innerText()
      );
      let schemaProdName = schemaJson["@graph"][2].name;
      console.log("schemaProdName:", schemaProdName);
      let h1 = await page.locator(":light(h1)").first().innerText();
      [schemaProdName, h1] = await page.evaluate(
        ([schemaProdName, h1]) => {
          function convert(str) {
            return str.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
              return "&#" + i.charCodeAt(0) + ";";
            });
          }
          return [convert(schemaProdName), convert(h1)];
        },
        [schemaProdName, h1]
      );
      console.log("schemaProdName:", schemaProdName);
      console.log("h1:", h1);
      // console.log("schemaProdName:", decodeURI(encodeURI(schemaProdName)));
      // console.log("h1:", decodeURI(encodeURI(h1)));
      expect(h1).toEqual(schemaProdName);
    });
  });
}

// for (const page in pages) {
//   describe("Test sitewide structured data", function () {
//     beforeEach(function () {
//       cy.visit(pages[page], { failOnStatusCode: false });
//       cy.checkForAmp();
//       cy.checkForPWA();
//     });
//     it("checks for #schemaGraph", () => {
//       cy.get("#schemaGraph").should("exist");
//     });
//     it("checks for breadcrumbs", () => {
//       cy.get("head").find("#schemaGraph").should("include.text", "Breadcrumb");
//     });
//   });
// }
// describe("Test PDP structured data", function () {
//   [pages.pdp, pages.pdpSkuId].forEach(function (page) {
//     beforeEach(function () {
//       cy.visit(page)
//         .checkForAmp()
//         .checkForPWA()
//         .get("#schemaGraph")
//         .as("schema");

//       cy.log(this.schema);
//     });
//     it("Checks for product schema", function () {
//       cy.get("@schema").should("include.text", "Product");
//     });
//     it("Confirms name in schema equals product name on page", function () {
//       let schemaJson = JSON.parse(this.schema[0].innerText);
//       const schemaProdName = schemaJson["@graph"][2].name;
//       cy.get("h1")
//         .invoke("text")
//         .should("equal", fromHtmlEntities(schemaProdName).normalize());
//     });
//   });
// });
