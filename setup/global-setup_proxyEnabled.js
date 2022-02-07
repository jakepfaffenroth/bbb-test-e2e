require("dotenv").config();
// const { chromium, testInfo } = require("@playwright/test");

module.exports = async () => {
  const msg = ` Routing through proxy at ${process.env.PROXY_IP} `;
  console.log("\033[48;5;76;38;5;0m" + msg + "\033[0m");
};
