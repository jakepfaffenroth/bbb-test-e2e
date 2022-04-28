require("dotenv").config();
const { chromium } = require("@playwright/test");
const colors = require("colors/safe");

module.exports = async (config) => {
  await checkProxy();
  checkEnv(config);
};

async function checkProxy() {
  const url = "https://em02-www.bbbyapp.com/apis/ignoreError?web3feo";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("response", async (res) => {
    let testUrl = new URL(url);
    let resUrl = new URL(res.url());
    if (/store\/?$/.test(testUrl.pathname)) {
      testUrl.pathname = "";
    }
    if (resUrl.href != testUrl.href) return;
    const headersArray = await res.headersArray();
    const isProxy =
      headersArray.filter((x) => /x-womp/i.test(x.name)).length > 0;

    console.log(
      `Proxy: ${
        isProxy ? colors.black.bgGreen(" ON ") : colors.black.bgYellow(" OFF ")
      }`
    );
  });

  await page.goto(url);
  await browser.close();
}

function checkEnv(config) {
  const baseURL = config.projects[0].use.baseURL;
  let [env] = baseURL.match(/em02|et01|dev01/) || ["prod"];
  console.log(`Environment: ${colors.green(env)}\n`);
}
