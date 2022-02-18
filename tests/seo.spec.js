const { test, expect, ...utils } = require("../utils");
const pages = require("../json/allPages.js");

for (const example in pages) {
  pages[example] += "&no-cache&no-bucket=true";
  let page;

  test.describe(example, function () {
    // test.describe.configure({ mode: "parallel" });
    // Do each test on same page instead of recreated every time
    test.beforeAll(async ({ browser }) => {
      const url = pages[example];
      page = await browser.newPage();
      await utils.init({ page, url });
    });
    test.afterAll(async () => {
      await page.close();
    });

    test.only("Validate title tag and meta description", async () => {
      // page.setDefaultTimeout(2000);
      const titleTag = page.locator("head title");
      const metaDesc = page.locator('head meta[name="description"]');

      const [titleTagCount, metaDescCount] = await Promise.all([
        titleTag.count(),
        metaDesc.count(),
      ]);

      expect
        .soft(titleTagCount, "Should have exactly one title tag")
        .toEqual(1);
      expect
        .soft(metaDescCount, "Should have exactly one meta description")
        .toEqual(1);
      const metaDescContent = await metaDesc.getAttribute("content");
      await expect.soft(metaDesc).not.toHaveAttribute("content", /undefined/);
      await expect.soft(metaDesc).toHaveAttribute("content", /.*/);
    });
    test("Validate robots tag", async () => {
      const robots = page.locator('head meta[name="robots"]');

      const [robotsCount] = await Promise.all([robots.count()]);

      expect
        .soft(robotsCount, "Should have exactly one robots meta tag")
        .toEqual(1);
    });
    test("Validate canonicals", async () => {
      const canonical = page.locator('head link[rel="canonical"]');

      const [canonicalCount] = await Promise.all([canonical.count()]);

      expect
        .soft(canonicalCount, "Should have canonical links")
        .toBeGreaterThanOrEqual(1);
    });
    test("Validate H1 heading", async () => {
      // :light prevents from looking in the shadow dom
      const h1Locator = page.locator(":light(h1)");

      const [h1Count] = await Promise.all([h1Locator.count()]);

      expect.soft(h1Count, "Should have exactly one H1 heading.").toEqual(1);
    });

    // test(`Validate Basic SEO`, async () => {
    //   const page = page.locator("page");
    //   const titleTag = page.locator("title");
    //   const metaDesc = page.locator('meta[name="description"]');
    //   const canonical = page.locator('link[rel="canonical"]');
    //   const robots = page.locator('meta[name="robots"]');

    //   const h1Locator = page.locator(":light(h1)");
    //   const [
    //     titleTagCount,
    //     metaDescCount,
    //     canonicalCount,
    //     robotsCount,
    //     h1Count,
    //   ] = await Promise.all([
    //     titleTag.count(),
    //     metaDesc.count(),
    //     canonical.count(),
    //     robots.count(),
    //     h1Locator.count(),
    //   ]);

    //   expect
    //     .soft(titleTagCount, "Should have exactly one title tag")
    //     .toEqual(1);
    //   expect
    //     .soft(metaDescCount, "Should have exactly one meta description")
    //     .toEqual(1);
    //   expect
    //     .soft(canonicalCount, "Should have canonical links")
    //     .toBeGreaterThanOrEqual(1);
    //   expect
    //     .soft(robotsCount, "Should have exactly one robots meta tag")
    //     .toEqual(1);
    //   expect(h1Count, "Should have exactly one H1 pageing.").toEqual(1);
    // });

    test(`Validate Twitter & OG Meta`, async () => {
      const ogType = page.locator('meta[property="og:type"]');
      const ogUrl = page.locator('meta[property="og:url"]');
      const ogTitle = page.locator('meta[property="og:title"]');
      const ogDesc = page.locator('meta[property="og:description"]');
      const ogImg = page.locator('meta[property="og:image"]');

      const twitterMeta = page.locator('meta[name^="twitter:"]');
      const [ogTypeCount, ogUrlCount, ogTitleCount, ogDescCount, ogImgCount] =
        await Promise.all([
          ogType.count(),
          ogUrl.count(),
          ogTitle.count(),
          ogDesc.count(),
          ogImg.count(),
        ]);

      expect
        .soft(ogTypeCount, "Should have exactly one title og:type meta tag")
        .toEqual(1);
      expect
        .soft(ogUrlCount, "Should have exactly one title og:url meta tag")
        .toEqual(1);
      expect
        .soft(ogTitleCount, "Should have exactly one title og:title meta tag")
        .toEqual(1);
      expect
        .soft(
          ogDescCount,
          "Should have exactly one title og:description meta tag"
        )
        .toEqual(1);
      expect(
        ogImgCount,
        "Should have exactly one title og:image meta tag"
      ).toEqual(1);
    });
  });
}
