const { chromium, devices, browser } = require("@playwright/test");
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

// const examplePage = { name: "US", path: "/store" };
for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "serial" });
    test.use({
      examplePage,
      checkVersion: false,
      login: true,
    });

    test.beforeEach(async ({ page, context, browser, baseURL }, testInfo) => {
      const storageState = await context.storageState();
      isMobile = testInfo.project?.use?.isMobile;
      page.isMobile = isMobile;
    });
    test.afterEach(async ({ context }) => {
      context.pages().forEach(async (page) => await page.close());
    });
    // test.afterAll(async ({ browser }) => {
    //   await browser.close();
    // });

    test("Create a registry", async ({ page }) => {
      await expect(page.locator("#accountlink:visible")).toHaveText(
        "My Account"
      );
      await page.waitForTimeout(2 * 1000);
    });
  });
}
