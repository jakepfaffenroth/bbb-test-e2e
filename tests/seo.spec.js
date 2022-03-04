const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    test.use({ examplePage, checkVersion: false });

    test.beforeEach(async ({ page, baseURL }) => {
      test.setTimeout(60 * 1000);
    });

    // test.skip("Check version", async ({ page }) =>
    //   await utils.checkVersion(page));
    test("Validate title tag", async ({ page }) => {
      page.waitForTimeout(10 * 1000);

      const titleTag = page.locator("head title");

      const titleTagCount = await titleTag.count();

      expect(titleTagCount, "Should have exactly one title tag").toEqual(1);
    });
    test("Validate meta description", async ({ page }) => {
      page.waitForTimeout(10 * 1000);

      const metaDesc = page.locator('head meta[name="description"]');

      const metaDescCount = await metaDesc.count();

      expect
        .soft(metaDescCount, "Should have exactly one meta description")
        .toEqual(1);
      // const metaDescContent = await metaDesc.getAttribute("content");
      await expect.soft(metaDesc).not.toHaveAttribute("content", /undefined/);
      await expect.soft(metaDesc).toHaveAttribute("content", /.*/);
    });
    test("Validate robots tag", async ({ page }) => {
      const robots = page.locator('head meta[name="robots"]');

      const [robotsCount] = await Promise.all([robots.count()]);

      expect
        .soft(
          robotsCount,
          `Should have exactly one robots meta tag:\n${await page.$$(
            'head meta[name="robots"]'
          )}`
        )
        .toEqual(1);
      await expect.soft(robots).toHaveText("index, follow");
    });
    test("Validate canonicals", async ({ page }) => {
      const canonical = page.locator('head link[rel="canonical"]');

      const [canonicalCount] = await Promise.all([canonical.count()]);

      expect
        .soft(canonicalCount, "Should have canonical links")
        .toBeGreaterThanOrEqual(1);
    });
    test("Validate H1 heading", async ({ page }) => {
      // :light prevents from looking in the shadow dom
      const h1Locator = page.locator(":light(h1)");

      const [h1Count] = await Promise.all([h1Locator.count()]);

      expect.soft(h1Count, "Should have exactly one H1 heading.").toEqual(1);
    });
    test(`Validate OG Meta`, async ({ page }) => {
      const ogType = page.locator('meta[property="og:type"]');
      const ogUrl = page.locator('meta[property="og:url"]');
      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDesc = page.locator('meta[property="og:description"]');
      const ogImg = page.locator('meta[property="og:image"]');

      const [ogTypeCount, ogUrlCount, ogTitleCount, ogDescCount, ogImgCount] =
        await Promise.all([
          ogType.count(),
          ogUrl.count(),
          ogTitle.count(),
          ogDesc.count(),
          ogImg.count(),
        ]);

      expect
        .soft(ogTypeCount, "Should have exactly one og:type meta tag")
        .toEqual(1);
      expect
        .soft(ogUrlCount, "Should have exactly one og:url meta tag")
        .toEqual(1);
      expect
        .soft(ogTitleCount, "Should have exactly one og:title meta tag")
        .toEqual(1);
      expect
        .soft(ogDescCount, "Should have exactly one og:description meta tag")
        .toEqual(1);
      expect
        .soft(ogImgCount, "Should have exactly one og:image meta tag")
        .toEqual(1);
      await Promise.all([
        expect
          .soft(ogType, "Should have one og:type meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(ogUrl, "Should have og:url meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(ogTitle, "Should have og:title meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(ogDesc, "Should have og:description meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect(ogImg, "Should have og:image meta content").toHaveAttribute(
          "content",
          /(.+)/i
        ),
      ]);
    });
    test(`Validate Twitter Meta`, async ({ page }) => {
      const card = page.locator('meta[name="twitter:card"]');
      const account_id = page.locator('meta[name="twitter:account_id"]');
      const title = page.locator('meta[name="twitter:title"]');
      const url = page.locator('meta[name="twitter:url"]');
      const description = page.locator('meta[name="twitter:description"]');
      const image = page.locator('meta[name="twitter:image"]');

      // const twitterMeta = page.locator('meta[name^="twitter:"]');
      const [
        cardCount,
        account_idCount,
        titleCount,
        urlCount,
        descriptionCount,
        imageCount,
      ] = await Promise.all([
        card.count(),
        account_id.count(),
        title.count(),
        url.count(),
        description.count(),
        image.count(),
      ]);

      expect
        .soft(cardCount, "Should have exactly one twitter:card meta tag")
        .toEqual(1);
      expect
        .soft(
          account_idCount,
          "Should have exactly one twitter:account_id meta tag"
        )
        .toEqual(1);
      expect
        .soft(titleCount, "Should have exactly one twitter:title meta tag")
        .toEqual(1);
      expect
        .soft(urlCount, "Should have exactly one twitter:url meta tag")
        .toEqual(1);
      expect
        .soft(
          descriptionCount,
          "Should have exactly one twitter:description meta tag"
        )
        .toEqual(1);
      expect
        .soft(imageCount, "Should have exactly one twitter:image meta tag")
        .toEqual(1);
      await Promise.all([
        expect
          .soft(card, "Should have exactly one twitter:card meta tag")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(account_id, "Should have twitter:account_id meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(title, "Should have twitter:title meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(url, "Should have twitter:url meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect
          .soft(description, "Should have twitter:description meta content")
          .toHaveAttribute("content", /(.+)/i),
        expect(image, "Should have twitter:image meta content").toHaveAttribute(
          "content",
          /(.+)/i
        ),
      ]);
    });
  });
}
