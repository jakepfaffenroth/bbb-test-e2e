/*
  This generator can create two kinds of test specs:
  (1) New pages created for every test; (2) One page used for each example page, reused between all tests for that page.

  Opening a new page for each test ensures a clean environment for the test, but is slower and greatly increases network traffic. If a page fails to load for some reason, only the single test will fail and the next one starts fresh.

  Reusing pages is much faster (especially for tests with little or no page interaction), but if the page load fails for whatever reason, every test will be skipped.
*/

const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const colors = require("colors/safe");

const content_newPages = `
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/XXXX.json"));

/*
  ~~ NEW PAGES ~~
  This test spec will open a new page for every test.
*/
for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: false, login: false });

    // test.beforeEach(async ({ page }) => {});

    test("New test", async ({ page }) => {});
  });
}
`;

const content_reusePages = `
const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/XXXX.json"));

/*
  ~~ REUSE PAGES ~~
  This test spec will use one page for each example page, reusing between tests.
*/
for (let examplePage of pages) {
  const testConfig = {
    checkVersion: false,  // Fail test if Appshell & AMP doc versions mismatch?
    login: false,  // Perform login flow prior to running tests?
    watchConsole: false,  // Boolean or regex
    examplePage,
    params: "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true",
  };

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    
    let page;
    
    test.beforeAll(async ({ baseURL, browser }, testInfo) => {
      Object.assign(testInfo, { testConfig, baseURL });
      page = await start({ browser, testInfo });
    });

    test.afterAll(async () => {
      await page.close();
    });

    // test.beforeEach(async () => {});

    test("New test", async () => {});
  });
}
`;

try {
  let isCustomName = false;
  let filename = "new";
  let content;

  rl.question(colors.cyan("Reuse pages? (Y/n)"), function (choiceReuse) {
    choiceReuse = choiceReuse || "Y";
    if (/n|no/i.test(choiceReuse.toLowerCase())) {
      console.log("-- A new page will be opened for each test");
      content = content_newPages;
    } else {
      console.log(
        "-- A single page will be reused for each example page in a spec"
      );
      content = content_reusePages;
    }

    rl.question(
      colors.cyan("Enter a file name? (Y/n)"),
      function (choiceFilename) {
        choiceFilename = choiceFilename || "Y";
        if (/n|no/i.test(choiceFilename.toLowerCase())) {
          rl.close();
          createFile(filename);
        }

        rl.question(
          colors.cyan("Test file name (___.spec.js):\n"),
          function (name) {
            isCustomName = true;
            filename = name;
            console.log(`-- Creating tests/${name}.spec.js`);
            rl.close();
            createFile(filename);
          }
        );
      }
    );
  });

  function createFile(filename) {
    fs.writeFileSync(`./tests/${filename}.spec.js`, content, {
      flag: "wx",
    });
  }
} catch (err) {
  console.log(err);
}
