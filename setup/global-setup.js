require("dotenv").config();
const { chromium } = require("@playwright/test");
const colors = require("colors/safe");

module.exports = async (config) => {
  await checkProxy();
};

async function checkProxy() {
  const url = "https://em02-www.bbbyapp.com/store?wmPwa&web3feo&wmFast";
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
      headersArray.filter((x) => /proxy/i.test(x.name)).length > 0;

    console.log(
      isProxy
        ? colors.black.bgGreen(" Routing through proxy ") + "\n"
        : colors.black.bgYellow(" Not routing through proxy ") + "\n"
    );
  });

  await page.goto(url);
  await browser.close();
}
