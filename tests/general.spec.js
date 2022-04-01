const { test, expect, utils } = require("../utils");
const { devices } = require("@playwright/test");
const pages = utils.prepPaths(require("../testPages/general.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, (testInfo) => {
    let isMobile = false;
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    test.beforeEach(async ({ page }, testInfo) => {
      isMobile = testInfo.project?.use?.isMobile;
      page.isMobile = isMobile;
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

      let domain = new URL(page.url()).hostname;
      // domain = domain.match(/.+\.com/)[0];
      // page.waitForNavigation({ waitUntil: "commit" });
      page.goto(domain + "/store/s/fun", { waitUntil: "commit" });
      await utils.waitForAmpBody(page);
      await expect(pencil).toBeHidden();
    });

    test.only("Category bar navigation", async ({ page }) => {
      const navWrap = page.locator("#navWrap");
      const categoryPill = page.locator(".catBarWrap .navPill:visible").nth(3);
      const shopAll = page.locator("#navWrap >> text=/Shop All/i").first();

      await categoryPill.click();
      await expect(navWrap).toBeVisible();
      await shopAll.click();
    });

    // test.only("Check burger menu", async ({ page }, testInfo) => {
    //   test.skip(/DSK/.test(testInfo.project.name));

    //   const burger = page.locator("button.menuBurger");
    //   const menuLinks = page.locator("[data-test=categoriesLink]");
    //   await burger.click();

    //   expect(menuLinks.first()).toBeVisible();
    // });

    // test.only("Category navigation DSK", async ({ page }, testInfo) => {
    //   test.skip(!/DSK/.test(testInfo.project.name));

    //   const shopByRoom = page.locator(
    //     "text=Shop By Room, text=Shop By Activity"
    //   );
    //   const navWrap = page.locator("#navWrap");

    //   shopByRoom.click();
    //   await expect(navWrap).toBeVisible();
    // });
  });

  // test.describe.only(examplePage.name + " - MOB", () => {
  //   test.describe.configure({ mode: "parallel" });
  //   // checkVersion flag - Validate that PWA and AMP doc versions match
  //   test.use({ examplePage, checkVersion: true });

  //   test("Check burger menu", async ({ page }) => {
  //     test.skip(/DSK/.test(testInfo.project.name));

  //     const burger = page.locator("button.menuBurger");
  //     const menuLinks = page.locator("[data-test=categoriesLink]");
  //     await burger.click();

  //     expect(menuLinks.first()).toBeVisible();
  //   });
  // });
}
