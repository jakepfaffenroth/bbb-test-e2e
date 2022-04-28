const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

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

    // test.beforeEach(async ({}, testInfo) => {
    //   isMobile = testInfo.project?.use?.isMobile;
    //   page.isMobile = isMobile;
    // });

    test("Pencil Banner collapse and close #smoke", async () => {
      const pencil = page.locator("#pencilBannerWrap");

      await expect(pencil).toBeVisible();
      if (page.isMobile)
        await page.evaluate(() => {
          window.scroll(0, 200);
        });
      else await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1000);
      const boxDown = await pencil.boundingBox();
      expect(boxDown.y).toBeLessThan(0);

      if (page.isMobile)
        await page.evaluate(() => {
          window.scroll(0, -200);
        });
      else await page.mouse.wheel(0, -200);
      await page.waitForTimeout(1000);
      const boxUp = await pencil.boundingBox();
      expect(boxUp.y).toEqual(0);

      await pencil.locator("button.pencilBannerClose").click();
      await expect(pencil).toBeHidden();

      page.goto("/store/s/fun", { waitUntil: "commit" });
      await utils.waitForAmpBody(page);
      await expect(pencil).toBeHidden();
    });

    test("Category bar navigation #smoke", async () => {
      const navWrap = page.locator("#navWrap");
      const categoryPill = page.locator(".catBarWrap .navPill:visible").nth(3);
      const shopAll = page.locator("#navWrap >> text=/Shop All/i").first();

      await categoryPill.click();
      await expect(navWrap).toBeVisible();
      // await shopAll.click();
    });

    test("Check burger menu #smoke", async () => {
      test.skip(!page.isMobile, "MOB only");
      const burger = page.locator("button.menuBurger");
      const sidebar = page.locator("#navWrap");
      await burger.click();
      await expect(sidebar).toBeVisible();
    });

    test("Shop by XXX Navigation DSK #smoke", async () => {
      test.skip(page.isMobile, "DSK only");
      const shopByRoom = page.locator("text=/Shop By Room|Shop By Activity/i");
      const navWrap = page.locator("#navWrap");

      await shopByRoom.click();
      await expect(navWrap).toBeVisible();

      // move mouse out of nav flyout to test that it closes
      await page.mouse.move(0, 0);
      await expect(navWrap).toBeHidden();

      await shopByRoom.click();
      await expect(navWrap).toBeVisible();
      const randNavItem = await getRandNavItem(page);

      const randNavItemPathname = new URL(
        await randNavItem.getAttribute("href")
      ).pathname.replace(/\/$/, "");
      await randNavItem.click();
      await page.waitForNavigation(/*{ waitUntil: "networkidle" }*/);
      await utils.waitForAmpBody(page);
      // console.log("page.url():", new URL(page.url()).pathname);
      // await page.pause();
      const pathname = new URL(page.url()).pathname.replace(/\/$/, "");
      expect(pathname).toEqual(randNavItemPathname);
    });
  });
}

async function getRandNavItem(page) {
  let randNavItem = await utils.getRandElement({
    page,
    selector: "#navWrap a.navItem:visible",
    scroll: false,
  });
  for (let i = 0; i < 3; i++) {
    if (!randNavItem || typeof randNavItem == "string") {
      console.log("RETRY");
      randNavItem = await getRandNavItem(page);
    }
  }
  // console.log("randNavItem:", randNavItem);

  test.skip(
    /NONE_FOUND|MISSING_ARGS/.test(randNavItem),
    "Failure to get rand nav item - " + randNavItem
  );

  return randNavItem;
}
