const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/plpAboveFoldContent.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: false });

    // test.beforeEach(async ({ page }) => {});

    test("Above the Fold content is present #smoke", async ({ page }) => {
      const content = page.locator(".plpFirst + .cmsRegionImport, #aboveGrid");
      await expect(content).not.toHaveCount(0);

      // Add content source to report for reference
      let ann;
      if (/cmsRegionImport/.test(await content.getAttribute("class"))) {
        ann = "scraped";
      } else if (/aboveGrid/.test(await content.getAttribute("id"))) {
        ann = "content stack";
      }
      test
        .info()
        .annotations.push({ type: "Content source", description: ann });
    });
  });
}
