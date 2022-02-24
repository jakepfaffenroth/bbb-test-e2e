const { expect } = require("@playwright/test");
const { webkit, devices } = require("@playwright/test");
const fs = require("fs/promises");
const utils = require("../utils/utils");
const colors = require("colors/safe");
// const { waitForAmpBody } = require("../utils");

module.exports = async (page) => {
  page.on("response", checkResponse);
  // envRouter(page);
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
    {
      name: "scene7Url using s7d9 domain",
      boolean: /s7d9\.scene7./.test(res.url()),
    },
  ];

  failConditions.forEach((condition) => {
    if (condition.boolean) {
      console.log(colors.yellow("Test failed: ") + condition.name);
    }
    expect(
      condition.boolean,
      "Failed network response condition: " + condition.name
    ).toBeFalsy();
  });

  if (!res.ok() && !acceptableBadResponses.some((x) => x == true)) {
    console.log(
      colors.yellow("Network Response Failed:") +
        ` ${res.url()} ${res.status()}: ${res.statusText()}`
    );
  }
  // expect(isResOk).toBeTruthy();
}

