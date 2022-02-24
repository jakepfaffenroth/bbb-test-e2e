const base = require("@playwright/test");
// const { test } = require("./fixtures");
const expect = base.expect;
const setup = require("../setup");

class Utils {
  setBaseURL = function (name, baseURL) {
    // const url = new URL(testInfo);

    let [concept] = name.match(/^(?:Baby|Harmon|CA|US)(?=:)/i) || ["us"];
    let [env] = baseURL.match(/em02|et01|dev01/) || ["prod"];
    concept = concept.toLowerCase();
    env = env.toLowerCase();
    // (1) Change baseURL to match the concept
    switch (concept) {
      case "baby":
        baseURL = "https://em02-www.bbbabyapp.com";
        break;
      case "ca":
        baseURL = "https://em02-www.bbbycaapp.com";
        break;
      case "harmon":
        baseURL = "https://em02harmon-www.bbbyapp.com";
        break;
      case "us":
      default:
        baseURL = "https://em02-www.bbbyapp.com";
        break;
    }

    // (2) Modify baseURL to match the environment
    switch (env) {
      case "prod":
        baseURL = baseURL
          .replace("em02-www.bbbyapp", "www.bedbathandbeyond")
          .replace("em02-www.bbbabyapp", "www.buybuybaby")
          .replace("em02-www.bbbycaapp.com", "www.bedbathandbeyond.ca")
          .replace("em02harmon-www.bbbyapp", "www.harmonfacevalues");
        break;
      case "et01":
        baseURL = baseURL.replace("em02", "et01");
        break;
      case "dev01":
        baseURL = baseURL
          .replace("em02-www", "dev01")
          .replace("em02harmon-www", "dev01harmon");
        break;
      default:
        break;
    }
    // console.log("baseURL:", baseURL);
    // console.log("EXITING FIXTURE");
    return baseURL;
  };
  init = async function ({ page, examplePage }) {
    if (!examplePage.path) return;
    await setup(page);
    page.goto(examplePage.path, { waitUntil: "commit" });
    await this.getPageType(page);
    await this.getVersionNumber(page);
    await this.waitForAmpBody(page);
    // await this.checkVersion(page);
  };
  prepPaths = function (pathsObj, opt = { subset: false }) {
    // TODO - return a random subset if opt.subset == true
    let pathsArr = [];
    Object.keys(pathsObj).forEach((key) => {
      pathsArr.push({ name: key, path: pathsObj[key] });
    });
    return pathsArr.sort((a, b) => a.name - b.name);
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
    const pageType = page.pageType || (await this.getPageType(page));
    const ampShadow = page.locator(
      `${pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"} body.amp-shadow`
    );
    await ampShadow.waitFor(60 * 1000);
    await expect(ampShadow).toHaveCount(1);
    page.softNav = true;
  };
  getVersionNumber = async function (page) {
    const pwaVersion = await page.locator("html").getAttribute("data-version");
    const ampDocVersion = await page
      .locator("body.amp-shadow")
      .getAttribute("data-version");
    page.version = {
      pwa: pwaVersion,
      ampDoc: ampDocVersion,
      versionMatch: pwaVersion == ampDocVersion,
    };
    console.log("version:", page.version);
  };
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
  waitAfterPdpSoftNav = async function (page) {
    await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
    await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
    await this.waitForAmpBody(page);
  };
  autoScroll = async function (page, delay = 100) {
    await page.evaluate(async (delay) => {
      // window.scrollBy(0, 400);
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
  getRandElement = async function ({
    page,
    selector = ".prodCard",
    scroll = true,
  }) {
    if (!page || !selector) return "MISSING_ARGS";
    const elements = page.locator(selector);

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
  getCartCount = async function (page) {
    // await page.waitForLoadState("load", { timeout: 60 * 1000 });
    // await page.waitForTimeout(3000);
    return Number(await page.locator("#cartCount").textContent());
  };
  search = async function (page, text) {
    await page.type("#searchInput", text);
    await page.keyboard.press("Enter");
  };
  // screenshotReact = async function ({ page, url, name }) {
  //   page.goto(url.replace("wmPwa", "wmSkipPwa"));
  //   await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  //   return await page.screenshot("./plp.spec.js-snapshots/" + name + "-xt.png");
  // };
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

const utils = new Utils();

module.exports = { utils };

// async function init({ page, url }) {
//   await setup(page);
//   if (!url) return;
//   page.goto(url, { waitUntil: "commit" });
//   // page.waitForNavigation({
//   //   waitUntil: "domcontentloaded",
//   //   timeout: 60 * 1000,
//   // });
//   await waitForAmpBody(page);
// }

// async function waitForAmpBody(page) {
//   // await page.waitForNavigation({ state: "commit" });

//   // await page.waitForSelector(
//   //   "text=The AMP version of this page is being built.",
//   //   { state: "hidden" }
//   // );
//   // const appshellLoadingScreen = page.locator(
//   //   "text=The AMP version of this page is being built."
//   // );
//   // await appshellLoadingScreen.waitFor({ timeout: 300 })
//   // if (await appshellLoadingScreen.isVisible({ timeout: 300 })) {
//   //   console.log("Building appshell...");
//   //   await page.waitForTimeout(30 * 1000);
//   // }
//   const pageType = page.pageType || (await getPageType(page));
//   await page
//     .locator(
//       `${pageType == "pdp" ? "#wmHostPdp" : "#wmHostPrimary"} body.amp-shadow`
//     )
//     .waitFor(60 * 1000);
//   page.softNav = true;
// }

// async function search(page, text) {
//   await page.type("#searchInput", text);
//   await page.keyboard.press("Enter");
// }

// async function checkVersion(page) {
//   const appShellVersion = await page
//     .locator("html")
//     .getAttribute("data-version");
//   const ampDocVersion = await page
//     .locator("body.amp-shadow")
//     .getAttribute("data-version");
//   expect(ampDocVersion).toEqual(appShellVersion);
// }

// async function getPageType(page) {
//   await page.waitForFunction(() => window.wmPwa);
//   const pageType = await page.evaluate(() => {
//     const destructure = ({
//       isHomeV2Reg,
//       isPDPV21Reg,
//       isPLPv2Reg,
//       isBrandReg,
//       isCLPReg,
//       isSearchReg,
//     }) => ({
//       home: isHomeV2Reg,
//       pdp: isPDPV21Reg,
//       plp: isPLPv2Reg,
//       brand: isBrandReg,
//       clp: isCLPReg,
//       search: isSearchReg,
//     });
//     const pageTypeTests = destructure(wmPwa.session.docTests);
//     let pageType;
//     for (const type in pageTypeTests) {
//       if (pageTypeTests[type].test(location.pathname)) {
//         pageType = type;
//       }
//     }
//     return pageType;
//   });
//   page.pageType = pageType;
//   return pageType;
// }

// async function autoScroll(page, delay = 100) {
//   await page.evaluate(async (delay) => {
//     await new Promise((resolve, reject) => {
//       var totalHeight = 0;
//       var distance = 100;
//       var timer = setInterval(() => {
//         var scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;

//         if (totalHeight >= scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, delay);
//     });
//   }, delay);
// }

// async function getRandElement({ page, selector, scroll = true }) {
//   const elements = page.locator(selector);

//   if (scroll) await autoScroll(page, 75);

//   const count = await elements.count();
//   if (!count) {
//     return "NONE_FOUND";
//   } else {
//     const selectedElement = elements.nth((count * Math.random()) | 0);
//     return selectedElement;
//   }
// }

// async function waitAfterPdpSoftNav(page) {
//   await page.waitForLoadState("networkidle", { timeout: 60 * 1000 });
//   await page.locator("#wmShellContentWrap.pdpActive").waitFor(60 * 1000);
//   await waitForAmpBody(page);
// }
