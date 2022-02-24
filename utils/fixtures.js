const base = require("@playwright/test");
const { utils } = require("./utils");
const setup = require("../setup");

module.exports.test = base.test.extend({
  examplePage: [{ name: "", path: "" }, { option: true }],
  checkVersion: [false, { option: true }],
  page: async ({ page, baseURL, examplePage, checkVersion }, use) => {
    const newBaseURL = setBaseURL(examplePage.name, baseURL);

    await setup(page);
    await page.goto(newBaseURL + examplePage.path, { waitUntil: "commit" });
    await utils.getPageType(page);
    await utils.waitForAmpBody(page);
    await utils.getVersionNumber(page);
    if (checkVersion) {
      await utils.checkVersion(page);
    }

    await use(page);
  },
});
module.exports.expect = base.expect;
module.exports.utils = utils;

function setBaseURL(name, baseURL) {
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
}
