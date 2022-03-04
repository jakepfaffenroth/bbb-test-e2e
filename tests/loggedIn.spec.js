const { chromium } = require("@playwright/test");
const colors = require("colors/safe");
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

let isMobile;

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false });

    test.beforeEach(async ({ page }, testInfo) => {
      page.isMobile = testInfo.project?.use?.isMobile;
      isMobile = page.isMobile;
    });

    test("Log in and return to PWA", async ({ page }) => {
      await utils.signIn(page);
      await page.goBack();

      isPWA = await utils.isPwa(page);
      expect(isPWA, "Is not PWA").toBeTruthy();
      // await auth(url);

      // if (page.isMobile) {
      //   await page.click("data-test=openMenu");
      //   await page.click('.navItemBtn:visible:text-matches("sign in", "i")');
      // }
      // // await page.pause();

      // await page.click("#accountV2List >> text=Sign In");

      // await page.fill('input[name="email"]', "jake.p@wompmobile.com");
      // await page.fill('input[name="password"]', "quinsy9seahorse.MAD");
      // await page.locator("#signin-submit").click();

      // await page.pause();
    });
  });
}

// async function signIn(page) {
//   if (isMobile) {
//     await page.click("data-test=openMenu");
//     if (!(await page.locator('button:text("my account")').isVisible())) {
//       await page.click('.navItemBtn:visible:text-matches("sign in", "i")');
//     } else {
//       await page.pause();
//     }
//   }

//   await page.click('#accountV2List >> text="Sign In"');

//   if ((await page.locator("text=hello").count()) > 0) {
//     await context.close();
//   }

//   await page.fill('input[name="email"]', "jake.p@wompmobile.com");
//   await page.fill('input[name="password"]', "quinsy9seahorse.MAD");
//   // const submitBtn = page.locator("#signin-submit");
//   // await page.evaluate(() => {
//   //   const btn = document.querySelector("#signin-submit");
//   //   btn.href = btn.href + "?&web3feo";
//   // });
//   await page.route(/loginSecure/i, async (route, request) => {
//     // await page.pause();
//     route.continue({ url: request.url() + "?&web3feo" });
//   });

//   await page.locator("#signin-submit").click();

//   await Promise.any([
//     // page.waitForNavigation(),
//     // page.locator("#signin-email_error_msg:visible").waitFor(),
//     page.locator('text="My Account Overview"').waitFor(),
//     page.locator('text="access PIN"').waitFor(),
//   ]);

//   if (await page.locator("#signin-email_error_msg:visible").isVisible()) {
//     await page.fill('input[name="email"]', "jake.p@wompmobile.com");
//     await page.locator("#signin-submit").click();
//   }

//   if (await page.locator('text="access PIN"').isVisible()) {
//     await auth(page.url());
//     await signIn(page);
//   } else if (await page.locator('text="My Account Overview"').isVisible()) {
//     console.log(colors.green("LOGGED IN"));
//     await page.pause();
//   }
// }

// async function auth(url) {
//   const store = "./store";
//   const context = await chromium.launchPersistentContext(store, {
//     headless: false,
//     bypassCSP: true,
//     // devtools: true,
//     slowMo: 500,
//   });
//   const page = await context.newPage();

//   await page.goto(url);

//   await signIn(page);
//   // await page.pause();
//   await context.close();
// }
