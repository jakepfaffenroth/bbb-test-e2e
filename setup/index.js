const { expect } = require("@playwright/test");
const { webkit, devices } = require("@playwright/test");
const fs = require("fs/promises");
const utils = require("../utils");
const colors = require("colors/safe");
// const { waitForAmpBody } = require("../utils");

module.exports = async (page) => {
  // await envRouter(page);
  page.on("response", checkResponse);
  // console.log('devices:', devices);
  // page.setDefaultNavigationTimeout(60 * 1000);
  // page.waitForNavigation({
  //   waitUntil: "domcontentloaded",
  //   timeout: 60 * 1000,
  // });

  // const url = await page.url();
  // if (/wmPwa/.test(url)) {
  //   await page.locator("body.amp-shadow").waitFor(60 * 1000);
  // } else {
  //   console.log("Not PWA - Not waiting for Amp Body.");
  // }
  // checkVersions(page);
};

// async function addWompParams(req) {
//   req.url
// }

async function checkResponse(res) {
  const acceptableBadResponses = [
    /ad\.doubleclick\.net|mpulse\.net/.test(res.url()),
    res.status() == 301 || res.status() == 302,
  ];

  const failConditions = [
    { name: "scene7Url", boolean: /s7d9\.scene7./.test(res.url()) },
  ];

  failConditions.forEach((condition) => {
    if (condition.boolean) {
      console.log(colors.yellow("Test failed: ") + condition.name);
      expect(condition.boolean).toBeFalsy();
    }
  });

  if (!res.ok() && !acceptableBadResponses.some((x) => x == true)) {
    // console.log("res headers:", await res.allHeaders());
    // console.log(
    //   "\033[38;5;226m" +
    //     `Network Response Failed: ${res.url()} ${res.status()}: ${res.statusText()}` +
    //     "\033[0m"
    // );
    console.log(
      colors.yellow("Network Response Failed:") +
        ` ${res.url()} ${res.status()}: ${res.statusText()}`
    );
  }
  // expect(isResOk).toBeTruthy();
}

async function envRouter(page) {
  const env = process.env.ENV;
  if (env) {
    await page.route(/em02/, (route, req) => {
      const oldUrl = req.url();
      let newUrl;
      switch (env) {
        case "em02":
          newUrl = oldUrl;
          break;
        case "et01":
          newUrl = oldUrl.replace("em02", "et01");
          break;
        case "dev01":
          newUrl = oldUrl
            .replace("em02-www", "dev01")
            .replace("em02harmon-www", "dev01harmon");
          break;
        case "prod":
          newUrl = oldUrl
            .replace("em02-www", "www")
            .replace("em02harmon-www.bbbyapp", "www.harmonfacevalues")
            .replace("bbbyapp", "bedbathandbeyond")
            .replace("bbbabyapp", "buybuybaby")
            .replace("bbbycaapp.com", "bedbathandbeyond.ca");
          break;
        default:
          newUrl = oldUrl;
          break;
      }
      route.continue({ url: newUrl });
    });
  }
}
