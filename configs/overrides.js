const paths = require("./paths");

module.exports = {
  globalSetup: require.resolve(`../${paths.globalSetupDir}`),
  testDir: `../${paths.testDir}`,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: `../../${paths.outputReportDir}` }],
  ],
  outputDir: `../../${paths.outputDir}`,
};
