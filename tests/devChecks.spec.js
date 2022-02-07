const { test, expect, ...utils } = require("../utils");
const pageExamples = require("../json/pageExamples.json");

for (const example in pageExamples) {
  test.describe.parallel("Dev Checks " + example, async () => {
    test.beforeEach(async ({ page }) => {
      await utils.init({ page, url: pageExamples[example] });
    });

    test("Is PWA: " + example, async ({ page }) => {
      expect(page.locator("html")).toHaveAttribute("amp-version", /[0-9]/);
      expect(page.locator("body").first()).toHaveClass(/PWAMP/);
    });

    test("No exposed code", async ({ page }) => {
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

    test("No duplicate IDs", async ({ page }) => {
      const exclusions = ["symbol#heart"];

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
  });
}
