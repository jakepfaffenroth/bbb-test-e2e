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

## Getting Started

Prerequisites:

- node.js

1. Create the necessary directory structure. It is recommended to create a parent directory with two subdirectories, `test-runner` and `test-results`.
2. Clone or fork this repository into `test-runner`
3. cd into the `test-runner` directory
4. NPM install
5. After NPM install, Playwright may prompt you to install additional packages. (or it may prompt after the next step)
6. Run `npm test home` to run your first tests!

## Command line

The most basic command is `npm test` This will run ALL tests (hundreds of them!) against em02 using the default config. However, there are several ways to set configurations from the command line:

Add a test file name/partial to run only matching specs:
e.g., `npm test home` only runs tests in files matching `home`
`npm test pdp` would run tests found in `pdp.spec.js` and in `pdp_seo.spec.js`

use `npm run test:et01` to use the et01 environment (possible envs: prod, em02, et01, dev01). (`npm test` does the same as `npm run test:em02`, it is just a shorthand)

Append arguments to an npm command with `--` like so: `npm test home -- --argument=1 --argument2`
--workers=n n= number of workers (cpu cores) to use. If workers=1, tests will run in sequence instead of in parallel. (Default half the CPU cores on the machine)
--headed Runs the tests in headed browsers (Default headless)
--debug shortcut for workers=1, headed, enable debug mode (shows playwright inspector tool)
--grep=str Str= test name or partial test name (Different from matching test files as outlined above)
--retries=n n= Number of times to retry a failed test (Default 0)

## Defaults

environment: em02
workers: Half the machine's CPU cores
headless
