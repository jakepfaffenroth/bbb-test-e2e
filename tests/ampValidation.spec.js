const { test, expect, utils } = require("../utils");
const colors = require("colors/safe");
const pages = utils.prepPaths(require("../testPages/general.json"));

console.log(
  colors.bgRed("Note: AMP Validation tests only work if local proxy is on")
);

for (let examplePage of pages) {
  examplePage.path += "?amp&web3feo";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({
      examplePage,
      checkVersion: false,
      login: false,
      watchConsole: /VALID AMP PAGE|AMP Validation Failure/,
    });
    test.slow();

    // test.beforeEach(async ({ page }) => {});

    test("Sitewide AMP validation", async ({ page }) => {
      await page.waitForSelector("html[amp]");
      // console.log("page.foundConsoleLogs:", page.foundConsoleLogs);
      const valid = page.foundConsoleLogs.some((x) =>
        /VALID AMP PAGE/.test(x.text())
      );
      const failed = page.foundConsoleLogs.some((x) =>
        /Validation Failure/.test(x.text())
      );
      expect(valid).toBeTruthy();
      expect(failed).toBeFalsy();
    });
  });
}
