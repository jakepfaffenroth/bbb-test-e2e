const { test, expect, ...utils } = require("../utils");
const pageExamples = require("../json/pageExamples.json");

for (const example in pageExamples) {
  test.describe.parallel(`Sitewide Header tests - ${example}`, () => {
    let isMobile = false;

    test.beforeEach(async ({ page }, testInfo) => {
      await utils.init({ page, url: pageExamples[example] });
      isMobile = testInfo.project?.use?.isMobile;
    });

    test("Pencil Banner collapse and close", async ({ page }) => {
      const pencil = page.locator("#pencilBannerWrap");

      await expect(pencil).toBeVisible();
      if (isMobile)
        await page.evaluate(() => {
          window.scroll(0, 200);
        });
      else await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1000);
      const boxDown = await pencil.boundingBox();
      expect(boxDown.y).toBeLessThan(0);

      if (isMobile)
        await page.evaluate(() => {
          window.scroll(0, -200);
        });
      else await page.mouse.wheel(0, -200);
      await page.waitForTimeout(1000);
      const boxUp = await pencil.boundingBox();
      expect(boxUp.y).toEqual(0);

      await pencil.locator("button.pencilBannerClose").click();
      // expect((await pencil.boundingBox()).y).toEqual(0);
      await expect(pencil).toBeHidden();

      let domain = page.url();
      domain = domain.match(/.+\.com/)[0];
      // page.waitForNavigation({ waitUntil: "commit" });
      page.goto(domain + "/store/s/fun", { waitUntil: "commit" });
      await utils.waitForAmpBody(page);
      await expect(pencil).toBeHidden();
    });

    if (isMobile) {
      test("Check burger menu", async ({ page }) => {
        const burger = page.locator("button.menuBurger");
        const menuLinks = page.locator("[data-test=categoriesLink]");
        await burger.click();

        expect(menuLinks.first()).toBeVisible();
      });
    }
  });
}
