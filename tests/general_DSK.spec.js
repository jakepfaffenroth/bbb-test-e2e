const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    // test.beforeEach(async ({ page }) => {});

    test("Shop by XXX Navigation DSK #smoke", async ({ page }) => {
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
