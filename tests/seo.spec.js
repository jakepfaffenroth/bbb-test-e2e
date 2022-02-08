const { test, expect, ...utils } = require("../utils");
const pages = require("../json/allPages.js");
// const pdpExamples = require("../json/pdpExamples.json");

const donePages = [];

for (const example in pages) {
  const url = pages[example];
  // Probably don't need to check seo on every breakpoint
  if (donePages.indexOf(url) > 0) {
    break;
  } else {
    donePages.push(url);
  }
  test.beforeEach(async ({ page }) => {
    await utils.init({ page, url });
    page.pageType = await utils.getPageType(page);
  });

  test.describe.parallel("SEO: " + example, function () {
    test(`Validate SEO: ${example}`, async ({ page }) => {
      const head = page.locator("head");
      const basicHeadSeo = head.locator(
        'title, meta[name="description"], link[rel="canonical"], meta[name="robots"]'
      );
      const ogMeta = head.locator('meta[property^="og:"]');
      const twitterMeta = head.locator('meta[name^="twitter:"]');
      const h1Locator = page.locator(":light(h1)");
      const [
        basicHeadSeoCount,
        ogMetaCount,
        twitterMetaCount,
        schemaGraphCount,
        h1Count,
      ] = await Promise.all([
        basicHeadSeo.count(),
        ogMeta.count(),
        twitterMeta.count(),
        page.locator("#schemaGraph").count(),
        h1Locator.count(),
      ]);

      // test.step("Basic tags", async () => {
      expect(basicHeadSeoCount).toBeGreaterThanOrEqual(4);
      // });
      // test.step("ogMeta", async () => {
      expect(ogMetaCount).toBeGreaterThanOrEqual(5);
      // });
      // test.step("twitterMeta", async () => {
      expect(twitterMetaCount).toBeGreaterThanOrEqual(6);
      // });
      // test.step("#schemaGraph", () => {
      expect(schemaGraphCount).toEqual(1);
      if (page.pageType != "search") {
        expect(page.locator("#schemaGraph")).toContainText(/Breadcrumb/i);
      }
      // });
      // test.step(`H1`, async () => {
      expect(h1Count).toEqual(1);
      // });
    });
    // test.describe.parallel("Structured data: " + example, async () => {
    //   test.beforeEach(async ({ page }) => {
    //     await utils.init({ page, url: pdpExamples[example] });
    //   });
    // });
  });
}

// for (const example in pdpExamples) {
// }

// test("Product name in schema equals page title", async () => {
//   test.skip(page.pageType != "pdp", "Not a PDP");
//   test.fixme();
//   const schemaGraph = page.locator("#schemaGraph");
//   await expect(schemaGraph).toContainText("Product");
//   let schemaJson = JSON.parse(
//     await page.locator("#schemaGraph").innerText()
//   );
//   let schemaProdName = schemaJson["@graph"][2].name;
//   console.log("schemaProdName:", schemaProdName);
//   let h1 = await page.locator(":light(h1)").first().innerText();
//   [schemaProdName, h1] = await page.evaluate(
//     ([schemaProdName, h1]) => {
//       function convert(str) {
//         return str.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
//           return "&#" + i.charCodeAt(0) + ";";
//         });
//       }
//       return [convert(schemaProdName), convert(h1)];
//     },
//     [schemaProdName, h1]
//   );
//   console.log("schemaProdName:", schemaProdName);
//   console.log("h1:", h1);
//   // console.log("schemaProdName:", decodeURI(encodeURI(schemaProdName)));
//   // console.log("h1:", decodeURI(encodeURI(h1)));
//   expect(h1).toEqual(schemaProdName);
// });
