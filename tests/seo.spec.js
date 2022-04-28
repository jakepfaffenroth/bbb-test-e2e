const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

/*
  ~~ REUSE ~~
  This test spec is set up to reuse the same page for every test of a given example page.
*/
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
      // test.slow();

      Object.assign(testInfo, { testConfig, baseURL });

      page = await start({ browser, testInfo });
    });

    test.afterAll(async () => {
      await page.close();
      console.log(`${test.info().title} - ${test.info().duration / 1000}s`);
    });

    // test.beforeEach(async () => {});

    test("Validate title tag", async () => {
      const titleTag = page.locator("head title");

      const titleTagCount = await titleTag.count();

      expect(titleTagCount, "Should have exactly one title tag").toEqual(1);
      await expect(titleTag).toContainText(/.+ \| (bed bath|buybuy|harmon)/i);
    });
    test("Validate meta description", async () => {
      // page.waitForTimeout(10 * 1000);

      const metaDesc = page.locator('head meta[name="description"]');

      const metaDescCount = await metaDesc.count();

      expect
        .soft(metaDescCount, "Should have exactly one meta description")
        .toEqual(1);
      // const metaDescContent = await metaDesc.getAttribute("content");
      await expect.soft(metaDesc).not.toHaveAttribute("content", /undefined/);
      await expect.soft(metaDesc).toHaveAttribute("content", /.+/);
    });
    test("Validate meta keywords", async () => {
      // page.waitForTimeout(10 * 1000);

      const metaKeywords = page.locator('head meta[name="keywords"]');

      const metaKeywordsCount = await metaKeywords.count();

      expect
        .soft(metaKeywordsCount, "Should have exactly one meta description")
        .toEqual(1);
      // const metaKeywordsContent = await metaKeywords.getAttribute("content");
      await expect
        .soft(metaKeywords)
        .not.toHaveAttribute("content", /undefined/);
      await expect.soft(metaKeywords).toHaveAttribute("content", /.+/);
    });

    test("Validate robots tag", async () => {
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
      expect
        .soft(await robots.getAttribute("content"))
        .toMatch(/(no)?index, (no)?follow/i);
    });
    test("Validate canonical & alternate links", async () => {
      const canonical = page.locator('head link[rel="canonical"]');
      const altEnUs = page.locator('head link[hreflang="en-us"]');
      const altEnCa = page.locator('head link[hreflang="en-ca"]');
      const altXDefault = page.locator('head link[hreflang="x-default"]');

      const [canonicalCount, altEnUsCount, altEnCaCount, altXDefaultCount] =
        await Promise.all([
          canonical.count(),
          altEnUs.count(),
          altEnCa.count(),
          altXDefault.count(),
        ]);

      expect.soft(canonicalCount, "Should have one canonical link").toEqual(1);
      expect
        .soft(altXDefaultCount, "Should have one x-default alternate link")
        .toEqual(1);
      if (!/harmon|baby/.test(page.url())) {
        expect
          .soft(altEnUsCount, "Should have one en-us alternate link")
          .toEqual(1);
        expect
          .soft(altEnCaCount, "Should have one en-ca alternate link")
          .toEqual(1);
        const caUrl = await altEnCa.getAttribute("href");

        const caUrlObj = new URL(await altEnCa.getAttribute("href"));
        const caRegex = new RegExp(
          `(bbbycaapp\\.com|bedbathandbeyond\\.ca)${caUrlObj.pathname}?`
        );
        expect.soft(await altEnCa.getAttribute("href")).toMatch(caRegex);
      } else {
        expect.soft(altEnUsCount, "Should have zero en-us links").toEqual(0);
        expect.soft(altEnCaCount, "Should have zero en-ca links").toEqual(0);
      }
    });
    test("Validate rel=amphtml href", async ({ context }) => {
      const url = page.url();
      const { origin, pathname } = new URL(url);
      const amphtmlHrefLocator = page.locator('head link[rel="amphtml"]');
      const amphtmlHrefCount = await amphtmlHrefLocator.count();
      const pwaAmphtmlHref = amphtmlHrefCount
        ? (await amphtmlHrefLocator.getAttribute("href")).replace(
            "&web3feo&wmFast&no-cache&no-bucket=true",
            ""
          )
        : "NO AMPHTML TAG FOUND";
      // console.log("origin, pathname:", origin, pathname);
      // console.log("pwaAmphtmlHref:", pwaAmphtmlHref);
      expect.soft(pwaAmphtmlHref).toBe(origin + "/amp" + pathname);
    });
    test("Validate H1 heading", async () => {
      // :light prevents from looking in the shadow dom
      const h1Locator = page.locator(":light(h1)");

      const [h1Count] = await Promise.all([h1Locator.count()]);

      expect.soft(h1Count, "Should have exactly one H1 heading.").toEqual(1);
    });
    test(`Validate OG Meta`, async () => {
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
      await expect
        .soft(ogTitle)
        .toHaveAttribute("content", /.+ \| (bed bath|buybuy|harmon)/i);
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
    test(`Validate Twitter Meta`, async () => {
      const card = page.locator('meta[name="twitter:card"]');
      const account_id = page.locator('meta[name="twitter:account_id"]');
      const title = page.locator('meta[name="twitter:title"]');
      const url = page.locator('meta[name="twitter:url"]');
      const description = page.locator('meta[name="twitter:description"]');
      const image = page.locator('meta[name="twitter:image"]');

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

      if (/bbbycaapp|beyond\.ca/.test(page.url())) {
        // Harmon and CA
        expect
          .soft(cardCount, "Should not have twitter:card meta tag")
          .toEqual(0);
        expect
          .soft(account_idCount, "Should not have twitter:account_id meta tag")
          .toEqual(0);
      } else {
        // US and Baby and Harmon
        expect
          .soft(cardCount, "Should have exactly one twitter:card meta tag")
          .toEqual(1);
        expect
          .soft(
            account_idCount,
            "Should have exactly one twitter:account_id meta tag"
          )
          .toEqual(1);
      }
      expect
        .soft(titleCount, "Should have exactly one twitter:title meta tag")
        .toEqual(1);
      await expect
        .soft(title)
        .toHaveAttribute("content", /.+ \| (bed bath|buybuy|harmon)/i);
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
