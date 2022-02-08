require("dotenv").config();
const baseConfig = require("./playwright.config.js");
// const globalConfig = require("./setup/global-setup_proxyEnabled.js");

process.env.ENV = "prod";
// baseConfig.use.proxy = { server: process.env.PROXY_IP };
// baseConfig.globalSetup = require.resolve(
//   "./setup/global-setup_proxyEnabled.js"
// );
module.exports = baseConfig;
