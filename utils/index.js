const { test, expect } = require("@playwright/test");
const setup = require("../setup");

class Utils {
  constructor() {
    this.test = test;
    this.expect = expect;
  }
  test;
  expect;
  init = async function ({ page, url }) {
    if (!url) return;
    await setup(page);
    page.goto(url, { waitUntil: "commit" });
    // page.waitForNavigation({
    //   waitUntil: "domcontentloaded",
    //   timeout: 60 * 1000,
    // });
    await Promise.all([this.getPageType(page), this.waitForAmpBody(page)]);
  };
  waitForAmpBody = async function (page) {
    // await page.waitForNavigation({ state: "commit" });

    // await page.waitForSelector(
    //   "text=The AMP version of this page is being built.",
    //   { state: "hidden" }
    // );
    // const appshellLoadingScreen = page.locator(
    //   "text=The AMP version of this page is being built."
    // );
    // await appshellLoadingScreen.waitFor({ timeout: 300 })
    // if (await appshellLoadingScreen.isVisible({ timeout: 300 })) {
    //   console.log("Building appshell...");
    //   await page.waitForTimeout(30 * 1000);
    // }
    const pageType = await this.getPageType(page);
    await page
      .locator(
        `${pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"} body.amp-shadow`
      )
      .waitFor(60 * 1000);
    page.softNav = true;
  };
  // checkResponse = async function (res) {
  //   const acceptableBadResponses = [
  //     /ad\.doubleclick\.net|mpulse\.net/.test(res.url()),
  //     res.status() == 301 || res.status() == 302,
  //   ];

  //   if (!res.ok() && !acceptableBadResponses.some((x) => x == true)) {
  //     // console.log("res headers:", await res.allHeaders());
  //     console.log(
  //       "\033[48;5;226;38;5;0m" +
  //         `Network Response Failed: ${res.url()} ${res.status()}: ${res.statusText()}` +
  //         "\033[0m"
  //     );
  //   }
  //   // expect(isResOk).toBeTruthy();
  // };
  search = async function (page, text) {
    await page.type("#searchInput", text);
    await page.keyboard.press("Enter");
  };
  checkVersion = async function (page) {
    const appShellVersion = await page
      .locator("html")
      .getAttribute("data-version");
    const ampDocVersion = await page
      .locator("body.amp-shadow")
      .getAttribute("data-version");
    expect(ampDocVersion).toEqual(appShellVersion);
  };
  getPageType = async function (page) {
    await page.waitForFunction(() => window.wmPwa);
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
      const pageTypeTests = destructure(wmPwa.session.docTests);
      let pageType;
      for (const type in pageTypeTests) {
        if (pageTypeTests[type].test(location.pathname)) {
          pageType = type;
        }
      }
      return pageType;
    });
    page.pageType = pageType;
    return pageType;
  };
  autoScroll = async function (page, delay = 100) {
    await page.evaluate(async (delay) => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
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
  // getPlpCards = async function ({
  //   page,
  //   selector = ".prodCard",
  //   scroll = true,
  // }) {
  //   const prodCards = page.locator(selector);

  //   if (scroll) await this.autoScroll(page, 75);

  //   const count = await prodCards.count();
  //   return !count ? "NONE_FOUND" : prodCards;
  //   // if () {
  //   // } else {
  //   //   // const selectedCard = prodCards.nth((count * Math.random()) | 0);
  //   //   return prodCards;
  //   // }
  // };
  getRandElement = async function ({
    page,
    selector = ".prodCard",
    scroll = true,
  }) {
    if (!page || !selector) return "MISSING_ARGS";
    const elements = page.locator(selector);

    if (scroll) await this.autoScroll(page, 75);
    // await elements.first().waitFor();
    if ((await elements.first().count()) == 0) {
      return this.getRandElement({ page, selector, scroll });
    }
    const count = await elements.count();
    if (!count) {
      return "NONE_FOUND";
    } else {
      const selectedElement = elements.nth((count * Math.random()) | 0);
      return selectedElement;
    }
  };
  getCartCount = async function (page) {
    // await page.waitForLoadState("load", { timeout: 60 * 1000 });
    // await page.waitForTimeout(3000);
    return Number(await page.locator("#cartCount").textContent());
  };
  waitAfterPdpSoftNav = async function (page) {
    await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
    await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
    await this.waitForAmpBody(page);
  };
  screenshotReact = async function ({ page, url, name }) {
    page.goto(url.replace("wmPwa", "wmSkipPwa"));
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    return await page.screenshot("./plp.spec.js-snapshots/" + name + "-xt.png");
  };
  pagination = {
    next: async function (page) {
      const nextPageBtn = page.locator("data-test=plpPaginationNext");
      // The page numbers have data-test="plpPaginationBack", not the prev button
      const pageNumberEl = page.locator("data-test=plpPaginationBack");

      const pageCur = Number(
        (await pageNumberEl.textContent())
          // .join(" ")
          .match(/([0-9]+)/)[0]
      );

      await nextPageBtn.scrollIntoViewIfNeeded();
      await nextPageBtn.click();
      // await page.waitForTimeout(500);
      await page.waitForSelector("#plpListInner div[role=list]");

      const pageNext = Number(
        (await pageNumberEl.textContent())
          // .join(" ")
          .match(/([0-9]+)/)[0]
      );
      return { pageCur, pageNext };
      // expect(pageNumberNext).toEqual(pageNumberCur + 1);
    },
    prev: async function (page) {
      const prevPageBtn = page.locator("button.plpPrev");
      // The page numbers have data-test="plpPaginationBack", not the prev button
      const pageNumberEl = page.locator("data-test=plpPaginationBack");

      const pageCur = Number(
        (await pageNumberEl.textContent())
          // .join(" ")
          .match(/([0-9]+)/)[0]
      );

      await prevPageBtn.scrollIntoViewIfNeeded();
      await prevPageBtn.click();
      // await page.waitForTimeout(500);
      await page.waitForSelector("#plpListInner div[role=list]");

      const pagePrev = Number(
        (await pageNumberEl.textContent())
          // .join(" ")
          .match(/([0-9]+)/)[0]
      );
      return { pageCur, pagePrev };
      // expect(pageNumberNext).toEqual(pageNumberCur + 1);
    },
  };
}

module.exports = new Utils();

async function init({ page, url }) {
  await setup(page);
  if (!url) return;
  page.goto(url, { waitUntil: "commit" });
  // page.waitForNavigation({
  //   waitUntil: "domcontentloaded",
  //   timeout: 60 * 1000,
  // });
  await waitForAmpBody(page);
}

async function waitForAmpBody(page) {
  // await page.waitForNavigation({ state: "commit" });

  // await page.waitForSelector(
  //   "text=The AMP version of this page is being built.",
  //   { state: "hidden" }
  // );
  // const appshellLoadingScreen = page.locator(
  //   "text=The AMP version of this page is being built."
  // );
  // await appshellLoadingScreen.waitFor({ timeout: 300 })
  // if (await appshellLoadingScreen.isVisible({ timeout: 300 })) {
  //   console.log("Building appshell...");
  //   await page.waitForTimeout(30 * 1000);
  // }
  const pageType = await getPageType(page);
  await page
    .locator(
      `${pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"} body.amp-shadow`
    )
    .waitFor(60 * 1000);
  page.softNav = true;
}

async function search(page, text) {
  await page.type("#searchInput", text);
  await page.keyboard.press("Enter");
}

async function checkVersion(page) {
  const appShellVersion = await page
    .locator("html")
    .getAttribute("data-version");
  const ampDocVersion = await page
    .locator("body.amp-shadow")
    .getAttribute("data-version");
  expect(ampDocVersion).toEqual(appShellVersion);
}

async function getPageType(page) {
  await page.waitForFunction(() => window.wmPwa);
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
    const pageTypeTests = destructure(wmPwa.session.docTests);
    let pageType;
    for (const type in pageTypeTests) {
      if (pageTypeTests[type].test(location.pathname)) {
        pageType = type;
      }
    }
    return pageType;
  });
  page.pageType = pageType;
  return pageType;
}

async function autoScroll(page, delay = 100) {
  await page.evaluate(async (delay) => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  }, delay);
}

async function getRandElement({ page, selector, scroll = true }) {
  const elements = page.locator(selector);

  if (scroll) await autoScroll(page, 75);

  const count = await elements.count();
  if (!count) {
    return "NONE_FOUND";
  } else {
    const selectedElement = elements.nth((count * Math.random()) | 0);
    return selectedElement;
  }
}

async function waitAfterPdpSoftNav(page) {
  await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
  await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
  await waitForAmpBody(page);
}

// module.exports = {
//   test,
//   expect,
//   init,
//   waitForAmpBody,
//   search,
//   checkVersion,
//   autoScroll,
//   getPageType,
//   getRandElement,
//   waitAfterPdpSoftNav,
//   checkResponse
// };
