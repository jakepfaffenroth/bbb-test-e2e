// @ts-check
require("dotenv").config();
const { devices } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const paths = require("./configs/paths.js");

const workerCount = process.env.WORKERS
  ? Number(process.env.WORKERS)
  : process.env.CI
  ? 1
  : undefined;
/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  globalSetup: require.resolve(`./${paths.globalSetupDir}`),
  // globalTeardown: require.resolve("./setup/global-teardown.js"),

  testDir: `./${paths.testDir}`,
  // retries: 1,
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: workerCount,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["./lib/reporters/list"],
    ["./lib/reporters/html", { open: "never", outputFolder: `../${paths.outputReportDir}` }],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,

    // proxy: { server: "http://192.168.0.101:9090" },

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "https://em02-www.bbbyapp.com",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "on",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "MOB: iPhone",
      testIgnore: /DSK|amp/,
      use: {
        ...devices["iPhone 11"],
      },
    },
    // iPad portait orientation - 768px wide
    {
      name: "TAB: iPad 768",
      // Don't need to run seo checks at every breakpoint
      testIgnore: /seo|DSK|amp/,
      use: {
        ...devices["iPad (gen 6)"],
      },
    },
    // viewport 1280px wide
    {
      name: "DSK: Chrome",
      // Don't need to run seo checks at every breakpoint
      testIgnore: /seo|MOB/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: `../${paths.outputDir}`,

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};
module.exports = config;
