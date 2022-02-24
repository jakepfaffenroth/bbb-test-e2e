require("dotenv").config();
const { chromium } = require("@playwright/test");
const colors = require("colors/safe");

module.exports = async (config) => {
  await checkProxy();
  checkEnv(config);
};

async function checkProxy() {
  const url = "https://www.bedbathandbeyond.com/apis/ignoreError";
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
      headersArray.filter((x) => /proxyman/i.test(x.name)).length > 0;

    console.log(
      isProxy
        ? colors.black.bgGreen(" Routing through proxy ") + "\n"
        : colors.black.bgYellow(" Not routing through proxy ") + "\n"
    );
  });

  await page.goto(url);
  await browser.close();
}

function checkEnv(config) {
  const baseURL = config.projects[0].use.baseURL;
  let [env] = baseURL.match(/em02|et01|dev01/) || ["prod"];
  console.log(`${colors.white(" Environment: ")} ${colors.green(env)}\n`);
}
