const { expect } = require("@playwright/test");
const { webkit, devices } = require("@playwright/test");
const fs = require("fs/promises");
const utils = require("../utils/utils");
const colors = require("colors/safe");
// const { waitForAmpBody } = require("../utils");

module.exports = async (page) => {
  page.on("response", checkResponse);
  page.route(/wmSkipPwa/, (route, request) => {
    route.continue({ url: request.url() + "&web3feo" });
  });
  page.route(/wmSkipPwa/, (route, response) => {
    route.continue({ url: response.url() + "&web3feo" });
  });
};

async function checkResponse(res) {
  const ignoreTheseUrls = [
    "ad.doubleclick",
    "mpulse",
    "narrativ",
    "quantum",
    "services/conversations",
    "recommendations/also-bought",
    "wompanalytics",
    "manifest",
  ].join("|");

  const acceptableBadResponses = [
    new RegExp(ignoreTheseUrls).test(res.url()),
    /301|302/.test(res.status())
  ];

  const failConditions = [
    // {
    //   name: "scene7Url using s7d9 domain",
    //   boolean: /s7d9\.scene7./.test(res.url()),
    // },
    // {
    //   name: "wmSkipPwa",
    //   boolean: /wmSkipPwa/.test(res.url()),
    // },
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
