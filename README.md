## TL;DR

This is a flexible, modular testing framework that can be run in a wide range of testing scenarios. It can be run with numerous configurations depending on the requirements. For example:

- A subset of smoke tests can be run immediately prior to publishing
- Individual tests can be run during development to facilitate Test Driven Design
- The complete test suite can be run on a remote VM weekly overnight
- Tests can be run for a specific environment
- Test can be run with or without local proxy to control which code is tested
- Tests can be written quickly to support active development

The test suite uses [playwright](https://www.playwright.dev) as a testing framwork. Playwright is exremely similar to puppeteer (in fact, is was created by the same developers as puppetter after they moved to Microsoft) so it should be immediately familiar to anyone used to puppeteer. Some additional benefits of playwright include:

- A tightly integrated test runner (puppeteer requires an add-on)
- Excellent cross-browser support (designate tests for Chrome, Firefox, Safari, etc.)

## Quick start

1. Create the necessary directory structure. It is recommended to create a parent directory with two subdirectories, `test-runner` and `test-results`.
2. Clone or fork this repository into `test-runner`
3. cd into the `test-runner` directory
4. Run `npm install`
5. Playwright may prompt you to install additional packages. (or it may prompt after the next step). Go ahead and do that.
6. Run `npm test home` to run your first tests!

## Command line

The most basic command is `npm test` This will run ALL tests (hundreds of them!) against em02 using the default config. You probably don't want to do this! It will take a very long time to finish and will consume a lot of CPU cycles. There are several ways to run subsets of tests and set configurations from the command line:

1. Add part of a test file name to run only matching specs:
   e.g., `npm test home` only runs tests in files matching `home`.
   `npm test pdp` will run tests found in `pdp.spec.js` and in `pdp_seo.spec.js`

2. Use `npm run test:et01` to use the et01 environment (possible envs: prod, em02, et01, dev01). (`npm test` does the same as `npm run test:em02`, it is just a shorthand)

3. Append arguments to an npm command with `--` like so: `npm test home -- --argument=1 --argument2`. Some useful arguments are:

   `--grep=str` Str= test name or partial test name (Different from matching test files as outlined above)

   `--quiet` Suppresses console logs during test execution (Nice for outputing a clean list of green checkmarks)

   `--workers=n` n= number of workers (cpu cores) to use. If workers=1, tests will run in sequence instead of in parallel. (Default is half the CPU cores on the machine)

   `--headed` Runs the tests in headed browsers (Default headless)

   `--debug` shortcut for workers=1, headed, enable debug mode (shows playwright inspector tool)

   `--retries=n` n= Number of times to retry a failed test (Default 0)

4. These can all be combined like so:

   `npm run test:prod plp -- --quiet --workers=1 --headed`

## Defaults

- environment: em02
- workers: Half the machine's CPU cores
- headless
- console logs output to terminal during test execution

## Proxy and local development

The tests run in headless browsers on your local machine, so they are subject to local proxy just like if you were manually opening a url. To remind us if our proxies are on/off when we start tests, the test-runner determines whether the proxy is on or off and outputs a message to the terminal. It does this by opening https://em02-www.bbbyapp.com/apis/ignoreError?web3feo during startup and examining th eresponse headers for `X-womp`, which is added by our proxies if it intercepts the response.

## Directory Structure

```
test-runner
│  Top-level configs, README, and misc other files & dirs>
│
└─ configs // env-specific config overrides
│
└─ lib // See readme in dir.
│
└─ setup // Global setup functions
│
└─ store // Stores authentication state for login process
│
└─ testPages // JSON files with paths to test
│
└─ tests // test.spec files
│
└─ utils // Reusable utility functions
```

## Test.spec.js files

Test.spec.js files define the actual tests to run. There are two kinds of test files:

1. Open a url and reuse the same page for all tests for that url (faster, recommended)
2. Open a brand new page for each test, even for same url as previous test (more resilient to one-off page-load failures)

### Example - New pages test.spec.js

```js
// Import utility functions and Playwright test and expect
const { test, expect, utils } = require("../utils");
// Define which urls to run the tests on.
// utils.prepPaths makes sure the JSON is in the correct format. In the future this could allow importing CSV files
const pages = utils.prepPaths(require("../testPages/XXXX.json"));

// Run the tests on each example url
for (let examplePage of pages) {
  const testConfig = {
    checkVersion: false, // Fail test if Appshell & AMP doc versions mismatch?
    login: false, // Perform login flow prior to running tests?
    watchConsole: false, // Boolean or regex
    examplePage,
    params: "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true",
  };
  examplePage.path += testConfig.params;

  // test.describe groups tests together and allows them to be run in parallel (faster) vs sequentially.
  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // Pass config options to startup script
    test.use(testConfig);

    test.beforeEach(async ({ page }) => {
      // Do something before each test (optional)
    });

    // This is a test - a page will be opened for it
    test("New test", async ({ page }) => {
      expect(1 + 1).toEqual(2);
    });

    // This is another test - A new page will be opened and previous one closed
    test("New test 2", async ({ page }) => {});
  });
}
```

### Example - Reuse pages test.spec.js

```js
// Same as new pages test.spec, but also import start script
const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/XXXX.json"));

// Same as new pages test.spec
for (let examplePage of pages) {
  const testConfig = {
    checkVersion: false, // Fail test if Appshell & AMP doc versions mismatch?
    login: false, // Perform login flow prior to running tests?
    watchConsole: false, // Boolean or regex
    examplePage,
    params: "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true",
  };

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });

    // Unlike new pages test.spec, we will reuse the page object, so it is defined in test.describe scope
    let page;

    // Set the config options and open the page using the config options we stored on testInfo, before any tests start running
    test.beforeAll(async ({ baseURL, browser }, testInfo) => {
      Object.assign(testInfo, { testConfig, baseURL });
      page = await start({ browser, testInfo });
    });

    // After all tests are done, close the page
    test.afterAll(async () => {
      await page.close();
    });

    // test.beforeEach(async () => {});

    // The page is already opened and navigated
    test("New test", async () => {});

    /* Don't close and reopen a new page - use the one that's already open!
       Be careful that the previous test has left the page in a state that's ready for the next test to begin.
       test.beforeEach() can be useful to "reset" the page prior to each test, (close menus, navigate back, etc.)
    */
    test("New test 2", async () => {});
  });
}
```

### Test Boilerplate Generator

You can see there's a lot of boilerplate necessary in the test.spec files. To make things simpler, test files can be generated by running an interactive CLI tool with `npm run create`. Choose to reuse or create new pages, input a filename, and it will generate the test.spec.js file for you.

**test.spec.js files should be named in a heirarchical way**; e.g., `plp.spec.js` is general to all PLPs, and `plp_leftRail.spec.js` tests just the left rail functionality. This way, ALL plp test files can be run with the command `npm test plp`, but if you want to test ONLY the left rail, you can do so with `npm test plp_leftRail`

Likewise, give tests logical titles that take advantage of the `--grep=str` command line argument. For example, There are multiple tests across multiple files that check the add to cart process. Because they all have `ATC` in their titles, they can all be run by using the `--grep=ATC` argument like this: `npm test -- --grep=ATC`

## Adding JSON test pages

If you can use an existing set of test urls, please do so. Otherwise, test page JSON files must be objects with key-value pairs like this:

```JSON
{
  "US:L2: Dinerware": "/store/category/dining/dinnerware/10532",
  "US:L2: Vacuums Floor Care AboveFold": "/store/category/storage-cleaning/vacuums-floor-care/10562",
  "US:L3: Pillowcases": "/store/category/bedding/sheets-pillowcases/pillowcases/15410",
  "US:L3: Bev Dispensers": "/store/category/dining/glasses-drinkware/beverage-dispensers/12926",
  "Baby:L2: Diapers": "/store/category/bath-diapering/diapers-wipes/32539",
  "Baby:L3: Swings": "/store/category/gear-travel/infant-activity/swings/32026",
  "Harmon:L2: Lips": "/store/category/Beauty/Lips/70025",
  "Harmon:L3: Shampoo": "/store/category/Hair-Care/Shampoo-Conditioner/Shampoos/70075"
}
```

The keys follow the format `<concept>:<page type>: <descriptive name>`. The keys MUST start with the concept (US, Baby, CA, Harmon) - The startup script uses this to set the hostname when fetching the example page. (The hostname is also set for the correct environment as determined by the npm command, e.g., `npm run test:et01`)
