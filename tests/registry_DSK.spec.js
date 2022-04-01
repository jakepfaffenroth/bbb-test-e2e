const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/home.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: true });
    test.slow();
    test.beforeEach(async ({ page }, testInfo) => {
      page.isMobile = testInfo.project?.use?.isMobile;
      isMobile = page.isMobile;
    });

    test("Create and delete registry", async ({ page }) => {
      await page
        .locator('[data-test*="categoriesLinkregistry"]:visible')
        .click();
      await createRegistry(page);
      // Click button:has-text("start adding")
      await page.locator('button:has-text("start adding")').click();

      // Click the first Add to Registry button on a product
      await page.locator("text=Add To Registry").nth(1).click();

      // Go back to home page
      await Promise.all([
        page.waitForNavigation(/*{ url: 'https://em02-www.bbbyapp.com/' }*/),
        page.locator("#site-logo-wrapper span").click(),
      ]);

      let isPWA = await utils.isPwa(page);
      expect(isPWA).toBeTruthy();

      // Deactivate Registry
      await deactivateRegistry(page);

      // isPWA = await utils.isPwa(page);
      // expect(isPWA).toBeTruthy();
    });
  });
}

async function createRegistry(page) {
  await page.locator("#registryNav:visible").waitFor();
  // Click text=start your registry
  await page.locator("#registryNav >> text=/start.*registry/i").click();

  await Promise.all([
    page.waitForNavigation(),
    page.locator('a[href*="createRegistryForm"]:visible').first().click(),
  ]);

  if (await page.locator("#signin-password").isVisible()) {
    // Fill [placeholder="\ Password"]
    await page.locator("#signin-password").fill(process.env.EMAIL_PW);
    // await Promise.all([
    //   page.waitForNavigation(),
    await page.locator("button#signin-submit:visible").click();
    // ]);
  }

  if (await page.locator("text=/expired/i").isVisible()) {
    await createRegistry(page);
  }
  // Parter's name
  await page
    .locator('[placeholder="Your\\ Partner\\\'s\\ First\\ Name"]')
    .fill("TestPartner");

  await page.locator("#coLastName").fill("TestersonPartner");

  // Date
  await page
    .locator('[placeholder="Select\\ a\\ Date\\ \\(mm\\/dd\\/yyyy\\)"]')
    .click();
  await page.locator("text=2025").click();
  await page.locator('[aria-label="Thu\\ Mar\\ 20\\ 2025"]').click();

  // Address and phone
  await page
    .locator('[placeholder="Street\\ Address\\/City\\/State\\/Zip\\ Code"]')
    .fill("1234");
  await page.locator("text=1234 North State StreetBellingham, WA, USA").click();
  await page.locator('[placeholder="Phone\\ Number"]').fill("1234567890");

  // Don't send me emails
  await page
    .locator(
      'label:has-text("Yes, I want to receive exclusive offers (like a registry completion coupon), exp")'
    )
    .click();

  // Click text=create registry
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://em02-www.bbbyapp.com/store/giftRegistry/viewRegistryOwner/home/521174640?hoorayModal=true' }*/),
    page.locator("text=create registry").click(),
  ]);
}

async function deactivateRegistry(page) {
  await page.locator('[data-test*="categoriesLinkregistry"]:visible').click();
  await page.locator('text="Wedding 03/20/2025" >> nth=0').click();
  // await page.pause();

  await page.locator(".NewRegistryHeaderLayout_4ub1 div .p0").click();
  await page.locator("text=Deactivate My Registry").click();
  console.log("page.env:", page.env);
  // await page.pause();
  if (page.env != "prod") {
    await page.route("**/*", async (route, request) => {
      route.continue({ url: request.url() + "?wmPwa&web3feo" });
    });
  }
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://em02-www.bbbyapp.com/' }*/),
    page.locator('[aria-label="deactivate-registry"]').click(),
  ]);
}
