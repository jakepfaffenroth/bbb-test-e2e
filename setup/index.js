const { expect } = require("@playwright/test");
const fs = require("fs/promises");
const utils = require("../utils");
// const { waitForAmpBody } = require("../utils");

module.exports = async (page) => {
  page.on("response", checkResponse);
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

  if (!res.ok() && !acceptableBadResponses.some((x) => x == true)) {
    // console.log("res headers:", await res.allHeaders());
    console.log(
      "\033[48;5;226;38;5;0m" +
        `Network Response Failed: ${res.url()} ${res.status()}: ${res.statusText()}` +
        "\033[0m"
    );
  }
  // expect(isResOk).toBeTruthy();
}
