require("dotenv").config();
const fs = require("fs");
const parse = require("csv-parse");
const base = require("@playwright/test");
const expect = base.expect;
const colors = require("colors/safe");
const setup = require("../setup/networkController");

class Utils {
  init = async function ({ page, examplePage }) {
    if (!examplePage.path) return;
    await setup(page);
    page.goto(examplePage.path, { waitUntil: "commit" });
    await this.getPageType(page);
    await this.getVersionNumber(page);
    await this.waitForAmpBody(page);
    // await this.checkVersion(page);
  };
  /**
   * Takes the object of paths and their names/descriptions and makes it into a sorted array of objects
   * @param {object} pathsObj Object of path names/descriptions (key) and path itself (value)
   * @param {object} [opt] Unused currently
   * @returns {array} sorted array of objects
   */
  prepPaths = function (pathsObj, opt) {
    // TODO - return a random subset if opt.subset == true
    let pathsArr = [];
    Object.keys(pathsObj).forEach((key) => {
      pathsArr.push({ name: key, path: pathsObj[key] });
    });
    return pathsArr.sort((a, b) => a.name - b.name);
  };

  /**
   * Determine if we're on React or PWA, and wait until the amp body is inserted into the page
   * @param {object} page The page fixture
   */
  waitForAmpBody = async function (page) {
    let isPWA;
    if (/wmSkipPwa/.test(await page.url())) {
      isPWA = false;
      // Force fail
      expect(isPWA, "React site - wmSkipPwa").toBeTruthy();
    }
    isPWA = await this.isPwa(page);
    expect(isPWA, "Is not PWA").toBeTruthy();

    // set page.softNav on first page load so we can differentiate soft/hard navs later.
    page.softNav = true;
  };
  /**
   * Determine if we're on PWA or React
   * Look for amp shadow body or [data-react-helmet]
   * @param {object} page Page fixture
   * @returns {boolean}
   */
  isPwa = async function (page) {
    // On first page load, getPageType has already been called.
    // Need to call again on subsequent soft navs.
    // Need to know if it's PDP to look for amp body in #wmHostPdp or #wmHostPrimary
    const pageType =
      page.softNav || !page.pageType
        ? await this.getPageType(page)
        : page.pageType;

    const ampLocator = page.locator(
      `${pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"} body.amp-shadow`
    );
    const reactLocator = page.locator("html[data-react-helmet]");

    // Find amp shadow body or react data-react-helmet, return true/false for "is PWA"
    return await Promise.any([!!reactLocator.count(), !!ampLocator.count()]);
  };

  /**
   * Get the PWA and AMP doc verison numbers and store them on the page fixture
   * @param {object} page Page fixture
   */
  getVersionNumber = async function (page, examplePage) {
    if (/(\?|&)amp/.test(page.url())) {
      page.version = {
        // pwa: "",
        // ampDoc: ampDocVersion,
        // versionMatch: pwaVersion == ampDocVersion,
      };
      return;
    }

    const pwaVersion = await page.locator("html").getAttribute("data-version");
    const ampDocVersion = await page
      .locator("body.amp-shadow")
      .getAttribute("data-version");
    page.version = {
      pwa: pwaVersion,
      ampDoc: ampDocVersion,
      versionMatch: pwaVersion == ampDocVersion,
    };
    const logMsg = `${pwaVersion}/${ampDocVersion}`;
    console.log(
      `PWA/AMP ${
        pwaVersion == ampDocVersion ? colors.green(logMsg) : colors.red(logMsg)
      } - ${examplePage.name}`
    );
  };

  /**
   * Compare PWA and AMP doc versions gotten from utils.getVersionNumber and assert that they're equal
   * Runs if test.use({checkVersion:true})
   * @param {object} page Page fixture
   */
  checkVersion = async function (page) {
    const appShellVersion = await page
      .locator("html")
      .getAttribute("data-version");
    const ampDocVersion = await page
      .locator(
        `${
          page.pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"
        } body.amp-shadow`
      )
      .getAttribute("data-version");
    expect(ampDocVersion, "Test failed for version mismatch").toEqual(
      appShellVersion
    );
  };

  /**
   * Runs javascript in the test's browser window to use wmPwa.session.docTests to determine the page type. Returns the page type and also stores it on the page fixture
   * @param {object} page Page fixture
   * @returns {string}
   */
  getPageType = async function (page) {
    await page.waitForFunction(() => window.wData || window.wmPwa);
    const pageType = await page.evaluate(() => {
      const destructure = ({
        isHomeV2Reg,
        isPDPV21Reg,
        isPLPv2Reg,
        isBrandReg,
        isCLPReg,
        isSearchReg,
      }) => ({
        home: isHomeV2Reg,
        pdp: isPDPV21Reg,
        plp: isPLPv2Reg,
        brand: isBrandReg,
        clp: isCLPReg,
        search: isSearchReg,
      });
      const pageTypeTests = destructure(
        window.wData
          ? window.wData.pwaSessionInit.docTests
          : window.wmPwa.session.docTests
      );
      let pageType;
      for (const type in pageTypeTests) {
        if (typeof pageTypeTests[type] == "string") {
          pageTypeTests[type] = new RegExp(pageTypeTests[type]);
        }
        if (
          pageTypeTests[type] &&
          pageTypeTests[type].test(location.pathname)
        ) {
          pageType = type;
        }
      }
      return pageType;
    });
    page.pageType = pageType;
    return pageType;
  };

  /**
   * Determine the concept and environment and update the hostname used in the test
   * If name is truthy string, is used to determine concept. Otherwise url is used.
   * Url is used to determine environment.
   * @param {string} url Hostname to modify
   * @param {string} [name] Example path name/description e.g., "Baby:L2: Sheets"
   * @returns {object} Object containing new hostname, concept, and env
   */
  setConceptEnv = function (url, name) {
    const urlObj = new URL(url);
    let isBABY, isCANADA, isHARMON;
    if (!name) {
      isBABY = /baby/i.test(urlObj.hostname);
      isCANADA = /\.ca|bbbycaapp/i.test(urlObj.hostname);
      isHARMON = /harmon/i.test(urlObj.hostname);
    }

    let [concept] = name
      ? name.match(/^(?:Baby|Harmon|CA|US)(?=:)/i) || ["us"]
      : [isBABY ? "Baby" : isCANADA ? "CA" : isHARMON ? "Harmon" : "US"];
    let [env] = urlObj.hostname.match(/em02|et01|dev01|et02|e-www3preview/) || [
      "prod",
    ];
    concept = concept.toLowerCase();
    env = env.toLowerCase();

    let newUrl = url;
    // (1) Change baseURL to match the concept
    switch (concept) {
      case "baby":
        newUrl = "https://em02-www.bbbabyapp.com";
        break;
      case "ca":
        newUrl = "https://em02-www.bbbycaapp.com";
        break;
      case "harmon":
        newUrl = "https://em02harmon-www.bbbyapp.com";
        break;
      case "us":
      default:
        newUrl = "https://em02-www.bbbyapp.com";
        break;
    }

    // (2) Modify newUrl to match the environment
    switch (env) {
      case "prod":
        newUrl = newUrl
          .replace("em02-www.bbbyapp", "www.bedbathandbeyond")
          .replace("em02-www.bbbabyapp", "www.buybuybaby")
          .replace("em02-www.bbbycaapp.com", "www.bedbathandbeyond.ca")
          .replace("em02harmon-www.bbbyapp", "www.harmonfacevalues");
        break;
      case "et01":
        newUrl = newUrl.replace("em02", "et01");
        break;
      case "dev01":
        newUrl = newUrl
          .replace("em02-www", "dev01")
          .replace("em02harmon-www", "dev01harmon");
        break;
      case "et02":
        newUrl = newUrl.replace("em02", "et02");
        break;
      case "e-www3preview":
        newUrl = newUrl
          .replace("em02-www", "e-www3preview")
          .replace("em02harmon-www", "e-www3previewharmon");
        break;
      default:
        break;
    }
    return { newUrl, concept, env };
  };

  /**
   * Force the test to wait after soft nav to pdp to give new amp page time to load
   * @param {object} page Page fixture
   */
  waitAfterPdpSoftNav = async function (page) {
    await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
    await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
    await this.waitForAmpBody(page);
  };

  /**
   * Scroll down to bottom of the page smoothly. Useful for making everything on the page lazy-load
   * @param {object} page Page fixture
   * @param {number} [delay=100] Scroll speed (Lower is faster). <75ms can be problematic.
   */
  autoScroll = async function (page, delay = 100) {
    await page.evaluate(async (delay) => {
      await new Promise((resolve, reject) => {
        setTimeout(() => resolve(), 45 * 1000); // escape hatch
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
    }, delay);
  };

  /**
   *
   * @param {object} object
   * @param {object} object.page Page fixture
   * @param {string} [object.selector=.prodCard] optional css selector
   * @param {boolean} [object.scroll=true] optional Flag to use autoscroll or not before getting random element
   * @returns {locator|string} locator if element found, otherwise string if error
   */
  getRandElement = async function ({
    page,
    selector = ".prodCard",
    scroll = true,
  }) {
    if (!page || !selector) return "MISSING_ARGS";
    const elements = page.locator(selector);
    await elements.first().waitFor();
    // if (scroll) await this.autoScroll(page, 100);
    // await elements.first().waitFor();
    // if ((await elements.first().count()) == 0) {
    //   return this.getRandElement({ page, selector, scroll });
    // }
    const count = await elements.count();
    if (!count) {
      return "NONE_FOUND";
    } else {
      const selectedElement = elements.nth((count * Math.random()) | 0);
      return selectedElement;
    }
  };

  /**
   * Quick shortcut to get the cart count number from header cart icon
   * @param {object} page Page fixture
   * @returns {number}
   */
  getCartCount = async function (page) {
    return Number(await page.locator("#cartCount").textContent());
  };

  /**
   * Shortcut to perform a search
   * Types the text into the search box, presses Enter, and waits for new the amp doc to load
   * @param {object} page Page fixture
   * @param {string} text search string
   */
  search = async function (page, text) {
    await page.type("#searchInput", text);
    await page.keyboard.press("Enter");
    await utils.waitForAmpBody(page);
  };

  // screenshotReact = async function ({ page, url, name }) {
  //   page.goto(url.replace("wmPwa", "wmSkipPwa"));
  //   await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  //   return await page.screenshot("./plp.spec.js-snapshots/" + name + "-xt.png");
  // };

  /**
   *
   */
  pagination = {
    /**
     * Navigate to the next page via the pagination button
     * @param {object} page Page fixture
     * @returns {object} Object contains the current page (navigated from) and next page (navigated to)
     */
    next: async function (page) {
      const nextPageBtn = page.locator("data-test=plpPaginationNext");
      // The page numbers have data-test="plpPaginationBack", not the prev button
      const pageNumberEl = page.locator("data-test=plpPaginationBack");

      const pageCur = Number(
        (await pageNumberEl.textContent()).match(/([0-9]+)/)[0]
      );

      await nextPageBtn.scrollIntoViewIfNeeded();
      await nextPageBtn.click();
      await page.waitForTimeout(500);
      await page.waitForSelector("#plpListInner div[role=list]");

      const pageNext = Number(
        (await pageNumberEl.textContent()).match(/([0-9]+)/)[0]
      );
      return { pageCur, pageNext };
    },
    /**
     * Navigate to the previous page via the pagination button
     * @param {object} page Page fixture
     * @returns {object} Object contains the current page (navigated from) and previous page (navigated to)
     */
    prev: async function (page) {
      const prevPageBtn = page.locator("button.plpPrev");
      // The page numbers have data-test="plpPaginationBack", not the prev button
      const pageNumberEl = page.locator("data-test=plpPaginationBack");

      const pageCur = Number(
        (await pageNumberEl.textContent()).match(/([0-9]+)/)[0]
      );

      await prevPageBtn.scrollIntoViewIfNeeded();
      await prevPageBtn.click();
      await page.waitForTimeout(500);
      await page.waitForSelector("#plpListInner div[role=list]");

      const pagePrev = Number(
        (await pageNumberEl.textContent()).match(/([0-9]+)/)[0]
      );
      return { pageCur, pagePrev };
    },
  };

  /**
   * Sign in flow - Clicks sign in button (or clicks through mobile menu first) until it navigates to login page. Then enters concept- and env-specific email and password and submits form. Then waits for, and checks that, the My Account page has loaded and that the login was successful.
   * @param {object} object
   * @param {object} object.page Page fixture
   * @returns
   */
  signIn = async function ({ page }) {
    if (!page.concept || !page.env) {
      const { concept, env } = this.setConceptEnv(page.url());
      Object.assign(page, { concept, env });
    }
    // Predictable email format
    const email = `${process.env.EMAIL_BASE}+bbb${page.env}${page.concept}@wompmobile.com`;
    const pw = process.env.EMAIL_PW;

    const currentPage = await page.url();

    // await page.pause();
    // Open menus and click sign in to get to react login page
    if (page.isMobile) {
      await page.click("data-test=openMenu");
      if (!(await page.locator('button:text("my account")').isVisible())) {
        await page.click('.navItemBtn:visible:text-matches("sign in", "i")');
        await Promise.all([
          page.waitForNavigation(),
          page.click('#accountV2List >> text="Sign In"'),
        ]);
      } else {
        console.log(colors.green("LOGGED IN"));
        return;
      }
    } else if (
      await page
        .locator('[data-test="HomeBurgerMenu"] p:has-text("sign in")')
        .isVisible()
    ) {
      // await Promise.all([
      // page.waitForNavigation(),
      await page.click('text="sign in"');
      // ]);
    } else {
      console.log(colors.green("LOGGED IN"));
      return;
    }

    // Are we already logged in?
    let isLoggedIn = (await page.locator('text="My Account"').count()) > 0;
    if (isLoggedIn) {
      console.log(colors.green("LOGGED IN"));
      return;
    }

    // if the popup CTA opens, close it so we can continue
    if (
      await (await page.locator("body>div[id^=bx-campaign]").first()).count()
    ) {
      // console.log(colors.redBG.white("FOUND IT"));
      await page.locator('[aria-label="close dialog"]:visible').click();
    }

    // Fill in login form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', pw);

    // Add web3feo to requests from react login page (really just need it appended to the loginSecure endpoint)
    async function interceptLoginSecure() {
      await page.route(/loginSecure/i, async (route, request) => {
        route.continue({ url: request.url() + "?&web3feo" });
      });
    }
    await interceptLoginSecure();

    page.on("response", async (res) => {
      if (/loginSecure/.test(res.url()) && res.status() > 400) {
        await interceptLoginSecure();
        await submitLoginForm();
      }
    });

    // Submit login form
    async function submitLoginForm() {
      if (
        await (await page.locator("body>div[id^=bx-campaign]").first()).count()
      ) {
        // console.log(colors.redBG.white("FOUND IT"));
        await page.locator('[aria-label="close dialog"]:visible').click();
      }

      await Promise.all([
        page.waitForNavigation(),
        page.locator("#signin-submit").click(),
      ]);
    }
    await submitLoginForm();

    //Need a better wait than a timeout before checking for logged-in status
    await page.waitForTimeout(3 * 1000);
    isLoggedIn = (await page.locator("text=/My Account/i").count()) > 0;
    expect(isLoggedIn, "Should be logged in here").toBeTruthy();

    if (await page.locator("text=/access PIN/i").isVisible()) {
      console.log(colors.red("Manual authentication needed"));
    } else if (await page.locator("text=/My Account Overview/i").isVisible()) {
      console.log(colors.green("LOGGED IN"));
    }
  };

  /**
   * Assembles the relative file path used to store the concept- and environment-specific perisistent login state
   * @param {object} object
   * @param {string} object.url hostname to use for getting environment
   * @param {object} object.examplePage example page object
   * @returns {string}
   */
  makeStorePath = function ({ url, examplePage }) {
    let [concept] = examplePage.name.match(/^(?:Baby|Harmon|CA|US)(?=:)/i) || [
      "us",
    ];
    let [env] = url.match(/em02|et01|dev01/) || ["prod"];
    concept = concept.toLowerCase();
    env = env.toLowerCase();

    return `store/auth/${concept}_${env}_state`;
  };
}

const utils = new Utils();

module.exports = { utils };
