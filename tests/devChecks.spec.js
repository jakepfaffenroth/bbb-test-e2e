const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/general.json"));

for (let examplePage of pages) {
  const testConfig = {
    checkVersion: false, // Fail test if Appshell & AMP doc versions mismatch?
    login: false, // Perform login flow prior to running tests?
    watchConsole: false, // Boolean or regex
    examplePage,
    params: "?wmPwa&web3feo&wmFast&no-cache&no-bucket=true",
  };

  test.describe(examplePage.name, () => {
    test.describe.configure({ mode: "parallel" });

    let page;

    test.beforeAll(async ({ baseURL, browser }, testInfo) => {
      Object.assign(testInfo, { testConfig, baseURL });
      page = await start({ browser, testInfo });
    });

    test.afterAll(async () => {
      await page.close();
    });

    // test.beforeEach(async () => {});

    test("Basic dev checks", () => {
      test.step("Is PWA", async () => {
        await expect(page.locator("html")).toHaveAttribute(
          "amp-version",
          /[0-9]+/
        );
        await expect(page.locator("body").first()).toHaveClass(/PWAMP/);
      });
    });
    test("No exposed code #smoke", async () => {
      // console.log(test.info().project.use);
      const exposedCode = await page.evaluate(() => {
        let node,
          exposedCode = [];
        const body = window.wmPwa
          ? wmPwa.session.docObjActive.shadowBody
          : document.querySelector("body");
        const walker = document.createTreeWalker(
          body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              return !/script|style|amp\-state/i.test(
                node.parentElement.tagName
              ) &&
                !node.parentElement.closest("AMP-SCRIPT") &&
                /[\S]+/.test(node.textContent) &&
                /\{.*\}|<|>|wData|doNotWomp/gim.test(node.textContent)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
            },
          },
          false
        );
        while ((node = walker.nextNode())) {
          const isFirst = !node.previousSibling;
          const parent = node.parentElement;
          const nodeText = node.textContent.replaceAll(/\s{2,}/gm, "");
          const obj = {
            txt: node.textContent.replaceAll(/\s{2,}/gm, ""),
            sample:
              "..." +
              (isFirst
                ? parent.outerHTML
                : node.previousSibling.outerHTML
              ).slice(-150) +
              nodeText.slice(0, 200),
          };
          exposedCode.push(obj);
        }

        return exposedCode;
      });
      if (exposedCode.length)
        console.log(
          "\033[48;5;226;38;5;0m" + "exposedCode:" + "\033[0m",
          exposedCode
        );
      expect(exposedCode.length).toEqual(0);
    });

    test("No duplicate IDs", async () => {
      const exclusions = ["symbol#heart"];

      // TODO - ignore exclusions
      let dupes = await page.evaluate((exclusions) => {
        const body = window.wmPwa
          ? wmPwa.session.docObjActive.shadowBody
          : document.querySelector("body");

        const elsWithIds = Array.from(
          body.querySelectorAll("*[id]:not([id=''])")
        );
        return elsWithIds
          .filter((el, i, arr) => {
            const count = arr.filter((x) => x.id == el.id).length;
            return count > 1 && /amp/i.test(el.tagName);
          })
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
          .map((elm) => {
            elm.innerHTML = "";
            return `<${elm.tagName.toLowerCase()} id='${elm.id}'>`;
          });
      }, exclusions);
      dupes = dupes.length ? dupes.join("\n") : "none";
      expect(dupes).toEqual("none");
    });

    test("No duplicate data-test attrs", async () => {
      const exclusions = [];

      // TODO - ignore exclusions?
      let dupes = await page.evaluate((exclusions) => {
        const body = window.wmPwa
          ? wmPwa.session.docObjActive.shadowBody
          : document.querySelector("body");

        const elsWithDataTests = Array.from(
          body.querySelectorAll("[data-test]")
        );
        return elsWithDataTests
          .filter((el, i, arr) => {
            const count = arr.filter((x) => x.dataset.test == el.dataset.test).length;
            return count > 1 && /amp/i.test(el.tagName);
          })
          .sort((a, b) => (a.dataset.test < b.dataset.test ? -1 : a.dataset.test > b.dataset.test ? 1 : 0))
          .map((elm) => {
            elm.innerHTML = "";
            return `<${elm.tagName.toLowerCase()} data-test='${elm.dataset.test}'>`;
          });
      }, exclusions);
      dupes = dupes.length ? dupes.join("\n") : "none";
      expect(dupes).toEqual("none");
    });
  });
}
