/* start.js
  - Updates the baseURL with concept and environment
  - Sets up the test with user configurations
  - Start network listeners
  - Go to test page
  - Perform checks (get the page type, wait for amp body to load, get version numbers)
  - Modify page fixture and return it to proceed with test
*/

const { startNetworkListeners } = require("../setup");
const { utils } = require("./utils.js");

module.exports = async function ({ browser, testInfo }) {
  const { testConfig } = testInfo;
  const { examplePage } = testConfig;
  const baseURL = testInfo.project.use.baseURL;

  examplePage.path += testConfig.params;
  // Account for query params in examplepage url
  const [search] = examplePage.path.match(/\?.*/) || [""];
  if (!/^\?wmPwa/.test(search)) {
    examplePage.path = examplePage.path.replace("?wmPwa", "&wmPwa");
  }

  const { newUrl, concept, env } = utils.setConceptEnv(
    baseURL,
    examplePage.name
  );

  const page = await browser.newPage({ baseURL: newUrl });

  // Put some convenience variables on the page fixture
  Object.assign(page, {
    concept,
    env,
    isMobile: testInfo.project?.use?.isMobile,
    baseURL: newUrl,
  });

  /**
   * Watch for console messages
   * watchConsole can be boolean or a regex
   * if watchConsole === true, forward all browser console msgs to playwright
   * if watchConsole is a regex, only print matching msgs and push the msg to page.foundConsoleLogs array.
   * The page.foundConsoleLogs array is useful for assertions (e.g., see ampValidation.spec.js)
   **/
  if (testConfig.watchConsole) {
    page.on("console", (msg) => {
      if (typeof testConfig.watchConsole == "boolean") {
        console.log(msg);
      } else if (testConfig.watchConsole.test(msg.text())) {
        console.log(msg);
        page.foundConsoleLogs = page.foundConsoleLogs || [];
        page.foundConsoleLogs.push(msg);
      }
    });
  }

  // Handle not-ok status codes and wmSkipPwa redirects
  await startNetworkListeners(page);

  if (testConfig.login) {
    // Before going to the test's examplePage, load the homepage and go through the signin flow
    await Promise.all([
      page.waitForNavigation(),
      page.goto(newUrl + "?wmPwa&web3feo&wmFast", { waitUntil: "commit" }),
    ]);
    await utils.waitForAmpBody(page);
    await utils.signIn({ page });
  }

  // test.use({ baseURL: newUrl });
  testInfo.project.use.baseURL = newUrl;
  await page.goto(examplePage.path, { waitUntil: "commit" });
  await utils.waitForAmpBody(page);
  await utils.getPageType(page);
  await utils.getVersionNumber(page, examplePage);
  if (testConfig.checkVersion) {
    await utils.checkVersion(page);
  }

  return page;
};
