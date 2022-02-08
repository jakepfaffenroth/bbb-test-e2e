require("dotenv").config();
// const { chromium, testInfo } = require("@playwright/test");
const colors = require("colors/safe");

module.exports = async () => {
  const msg = ` Routing through proxy at ${process.env.PROXY_IP} `;
  console.log(colors.black.bgGreen(msg));
};
