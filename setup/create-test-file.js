const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const content = `
const { test, expect, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/XXXX.json"));

for (let examplePage of pages) {
  examplePage.path += "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true";

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });
    // checkVersion flag - Validate that PWA and AMP doc versions match
    test.use({ examplePage, checkVersion: true });

    test.beforeEach(async ({ page }) => {});

    test("New test", async ({ page }) => {});
  });
}
`;

try {
  let isCustomName = false;
  let filename = "new";
  rl.question("Enter file name? (Y/n)", function (choice) {
    choice = choice || "Y";
    if (/n|no/i.test(choice.toLowerCase())) {
      rl.close();
      createFile(filename);
    }

    rl.question("Test file name (___.spec.js):\n", function (name) {
      isCustomName = true;
      filename = name;
      console.log(`Creating tests/${name}.spec.js`);
      rl.close();
      createFile(filename);
    });
  });

  function createFile(filename) {
    fs.writeFileSync(`./tests/${filename}.spec.js`, content, {
      flag: "wx",
    });
  }
} catch (err) {
  console.log(err);
}
