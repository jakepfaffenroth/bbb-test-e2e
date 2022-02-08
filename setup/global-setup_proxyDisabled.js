require("dotenv").config();
// const { chromium, testInfo } = require("@playwright/test");
const colors = require("colors/safe");

module.exports = async (config) => {
  // console.log(
  //   "\033[48;5;226;38;5;0m" +
  //     (process.env.ENV || "em02") +
  //     " environment" +
  //     "\033[0m"
  // );
  console.log("\n" + colors.black.bgYellow(" Not routing through proxy "));
};
