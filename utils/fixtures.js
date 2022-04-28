const base = require("@playwright/test");
const colors = require("colors/safe");
const { utils } = require("./utils");
const { startNetworkListeners } = require("../setup");

module.exports.test = base.test.extend({
  /* These are configs */
  examplePage: [{ name: "", path: "" }, { option: true }],
  checkVersion: [false, { option: true }],
  watchConsole: [false, { option: true }],
  login: [false, { option: true }],
  /*
   *
   * These override the built-in fixtures */
  context: async ({ browser, context, baseURL, examplePage, login }, use) => {
    if (login) {
      // Create a new peristent context and use that one instead of the original
      const storePath = utils.makeStorePath({ url: baseURL, examplePage });
      const newContext = await browser._browserType.launchPersistentContext(
        storePath,
        {
          headless: false,
          bypassCSP: true,
        }
      );
      await use(newContext);
    } else {
      // Just use the original context without modifying it
      await use(context);
    }
  },
  page: async (
    { page, baseURL, examplePage, checkVersion, watchConsole, login },
    use
  ) => {
    // Change the hostname for the correct concept and environment
    const { newUrl, concept, env } = utils.setConceptEnv(
      baseURL,
      examplePage.name
    );
    Object.assign(page, { concept, env });

    /**
     * Watch for console messages
     * watchConsole can be boolean or a regex
     * if watchConsole === true, forward all browser console msgs to playwright
     * if watchConsole is a regex, only print matching msgs and push the msg to page.foundConsoleLogs array.
     * The page.foundConsoleLogs array is useful for assertions (e.g., see ampValidation.spec.js)
     **/
    if (watchConsole) {
      page.on("console", (msg) => {
        if (typeof watchConsole == "boolean") {
          console.log(msg);
        } else if (watchConsole.test(msg.text())) {
          console.log(msg);
          page.foundConsoleLogs = page.foundConsoleLogs || [];
          page.foundConsoleLogs.push(msg);
        }
      });
    }

    // Handle not-ok status codes and wmSkipPwa redirects
    await startNetworkListeners(page);

    if (login) {
      // Before going to the test's examplePage, load the homepage and go through the signin flow
      await Promise.all([
        page.waitForNavigation(),
        page.goto(newUrl + "?wmPwa&web3feo&wmFast", { waitUntil: "commit" }),
      ]);
      await utils.waitForAmpBody(page);
      await utils.signIn({ page });
    }

    // Continue to test page and do various pre-checks
    await page.goto(newUrl + examplePage.path, { waitUntil: "commit" });
    await utils.getPageType(page);
    await utils.waitForAmpBody(page);
    await utils.getVersionNumber(page, examplePage);
    if (checkVersion) {
      await utils.checkVersion(page);
    }

    // Send the page back to the test to continue with actions and assertions
    await use(page);
  },
});
module.exports.expect = base.expect;
module.exports.utils = utils;
