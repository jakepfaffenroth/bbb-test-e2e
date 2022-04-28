const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

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
      Object.assign(testInfo, { testConfig, baseURL });
      page = await start({ browser, testInfo });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test.beforeEach(async () => {
      const url = new URL(page.url());
      if (url.pathname + url.search != examplePage.path) {
        await page.goto(examplePage.path);
      }
    });

    test("Search Color #smoke", async () => {
      await utils.search(page, "blue");

      // Locate elements, this locator points to a list.
      // await page.pause();
      await page.locator("#plpListInner .prodCard").first().waitFor();
      const prodCards = page.locator("#plpListInner .prodCard");
      const cardCount = await prodCards.count();
      let blueCount = 0;
      for (let i = 0; i < cardCount; ++i) {
        if (/blue|navy/i.test(await prodCards.nth(i).textContent())) {
          blueCount++;
        }
      }
      // Arbitrary 40% of product cards should have "blue" in them?
      expect(
        blueCount / cardCount,
        `Only ${blueCount} prod. card(s) have "blue" in them`
      ).toBeGreaterThan(0.4);

      // console.log(await prodCards.nth(i).textContent());
      // await expect(page.locator("#plpListInner")).toHaveText(/in blue/i);

      // const cardFacet = page
      //   .locator(`.prodCard:has(.facet:text-matches("blue|navy", "i"))`)
      //   .first();
      // const colorInCard = await cardFacet.innerText();
      // await cardFacet.click();
      // const defaultFacet = await page
      //   .locator(".colorSwatches button.active")
      //   .getAttribute("aria-label");

      // const re = new RegExp(colorInCard, "i");
      // expect(defaultFacet).toMatch(re);
    });

    test("Search with quote #smoke", async () => {
      await utils.search(page, `12"`);

      await page.locator("#plpListInner .prodCard").first().waitFor();
      const prodCards = page.locator("#plpListInner .prodCard");
      const cardCount = await prodCards.count();

      expect(cardCount).toBeGreaterThan(0);
    });
  });
}
