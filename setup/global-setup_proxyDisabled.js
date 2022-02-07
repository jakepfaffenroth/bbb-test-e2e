require("dotenv").config();
const { chromium, testInfo } = require("@playwright/test");

module.exports = async (config) => {
  console.log(
    "\033[48;5;226;38;5;0m" + " Not routing through proxy " + "\033[0m"
  );
};
