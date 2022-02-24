require("dotenv").config();
const baseConfig = require("../playwright.config.js");
const overrides = require("./overrides");
// const globalConfig = require("./setup/global-setup_proxyEnabled.js");

module.exports = {
  ...baseConfig,
  ...overrides,
  use: { baseURL: "https://em02-www.bbbyapp.com" },
};
