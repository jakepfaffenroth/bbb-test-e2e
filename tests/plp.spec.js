const { test, expect, start, utils } = require("../utils");
const pages = utils.prepPaths(require("../testPages/plp.json"));

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

    test.beforeEach(async () => {
      test.slow();

      const url = new URL(page.url());
      // console.log("url.pathname:", url.pathname);
      // console.log("url.search:", url.search);
      // console.log("examplePage.path:", examplePage.path);
      if (url.pathname + url.search != examplePage.path) {
        await goBackToPlp(page);
      }
    });

    // test("Flow: ATC", async ({ page }) => {
    //   await page.locator("#plpListInner").scrollIntoViewIfNeeded();
    //   await page
    //     .locator("#plpListInner div[role='list']")
    //     .waitFor({ timeout: 0 });
    //   const selectedCard = await utils.getRandElement({
    //     page,
    //     // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
    //     selector:
    //       '.prodCard:has(.plpAtc:text-matches("Add to Cart", "i"):visible)',
    //   });

    //   test.skip(
    //     selectedCard == "NONE_FOUND",
    //     "No prodCards found with ATC btn."
    //   );

    //   const cartCount = page.locator("#cartCount");
    //   const cartCountBefore = Number(await cartCount.textContent());

    //   await selectedCard
    //     .locator('.plpAtc:text-matches("Add to Cart", "i"):visible')
    //     .click();
    //   await page.waitForLoadState("load", { timeout: 60 * 1000 });

    //   const modalCartWrap = page.locator("#fulfillmentModal, #modalCartWrap");
    //   const cartError =
    //     /cartErrorModal/.test(await modalCartWrap.getAttribute("class")) ||
    //     (await modalCartWrap.locator(".panelAlert:visible").count()) > 0;
    //   await expect(modalCartWrap).toBeVisible();
    //   await modalCartWrap.locator("button.modalClose:visible").click();
    //   await expect(modalCartWrap).toBeHidden();
    //   test.skip(
    //     cartError,
    //     "Error adding to cart, e.g., out of stock or API error."
    //   );
    //   const cartCountAfter = Number(await cartCount.textContent());
    //   expect(cartCountAfter).toEqual(cartCountBefore + 1);
    // });

    // test("Click around PLP #smoke", async ({ page }) => {
    test("Pagination #smoke", async () => {
      const firstProdCard = page.locator(".prodCard").first();
      let comparisonCardId = await firstProdCard.getAttribute("id");
      let selectedCardId;
      let pageCur, pageNext, pagePrev;
      const nextPageBtn = page.locator("data-test=plpPaginationNext");
      const prevPageBtn = page.locator("button.plpPrev");

      await page.locator("#plpPagination").scrollIntoViewIfNeeded();

      let count;

      for (let i = 0; i < 2; i++) {
        if (!/disabled/.test(await nextPageBtn.getAttribute("class"))) {
          await ({ pageCur, pageNext } = await utils.pagination.next(page));

          expect(pageNext).toEqual(pageCur + 1);
          await compareFirstProdCardIds();

          count++;
        }
      }


      for (let i = 0; i < count; i++) {
        if (!/disabled/.test(await prevPageBtn.getAttribute("class"))) {
          await ({ pageCur, pagePrev } = await utils.pagination.prev(page));

          expect(pagePrev).toEqual(pageCur - 1);
          await compareFirstProdCardIds();
        }
      }

      async function compareFirstProdCardIds() {
        selectedCardId = await firstProdCard.getAttribute("id");
        expect(selectedCardId).not.toEqual(comparisonCardId);
        comparisonCardId = selectedCardId;
      }
    });

    test("Flow: Choose Options #smoke", async () => {
      await page.locator("#plpListInner").scrollIntoViewIfNeeded();
      await page
        .locator("#plpListInner div[role='list']")
        .waitFor({ timeout: 0 });
      const selectedCard = await utils.getRandElement({
        page,
        // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
        selector: '.prodCard:has(.plpAtc:text-matches("Choose Options", "i"))',
      });
      test.skip(
        selectedCard == "NONE_FOUND",
        "No prodCards found with Choose Options btn."
      );
      await selectedCard
        .locator(".plpAtc:text-matches('Choose Options', 'i')")
        .click();
      await utils.waitAfterPdpSoftNav(page);
      await expect(page.locator("#wmHostPdp body.amp-shadow")).toBeVisible();
      await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeHidden();

      // await goBackToPlp(page);
    });

    test("Flow: PLP->PDP #smoke", async () => {
      const selectedCard = await utils.getRandElement({
        page,
        selector: ".prodCard",
      });
      test.skip(selectedCard == "NONE_FOUND", "No prodCards found.");
      const cardTitleLocator = selectedCard.locator("a.plpProdTitle");

      page.waitForNavigation();
      await cardTitleLocator.click();

      await utils.waitAfterPdpSoftNav(page);

      await expect(page.locator("#wmHostPdp body.amp-shadow")).toBeVisible();
      await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeHidden();

      // await goBackToPlp(page);
    });

    test("Toggle Pickup and SDD filters", async () => {
      test.skip(/harmon/.test(page.url()), "SDD and BOPIS disabled on Harmon");

      const [isBopisPillVisible, isSddPillVisible] = await arePillsVisible(
        page
      );
      test.skip(
        (await page.locator(".plpBopisSddBtns .noStore.disabled").count()) > 0,
        "No Store Selected - checkboxes disabled"
      );
      expect(isBopisPillVisible).toBeFalsy();
      expect(isSddPillVisible).toBeFalsy();

      await clickBopis(page);
      await clickSdd(page);
      await clickBopis(page);
      await clickSdd(page);
    });

    test("Apply various filters #smoke", async () => {
      // test.fixme();
      // test.setTimeout(45 * 1000);
      let bopisClicked;
      if (
        !/harmon/.test(page.url()) &&
        (await page.locator(".plpBopisSddBtns .noStore.disabled").count()) > 0
      ) {
        bopisClicked = true;
        await clickBopis(page);
      }

      if (!/DSK/.test(test.info().project.name)) {
        await page.locator("data-test=plpFilterResultsBtn").click();
      }

      const allUncheckedAccordians = page.locator(
        "#facetsList input.cbh:not(:checked) ~ .plpOptLbl"
      );
      const count = await allUncheckedAccordians.count();
      await page.waitForSelector("#facetsList .plpOpt");
      const hScrollList = page.locator(".hScrollList:visible");

      const usedFacets = [];
      // await test.step("Apply facets", async () => {
      for (let i = 0; i < 3; i++) {
        // Get one of the closed accordians and open it
        await clickRandAccordian();
        // const randAccordian = await getRandAccordian();
        // if (typeof randAccordian == String) {
        //   console.log("randAccordian not found");
        // }
        // if (await randAccordian.isHidden()) {
        // }
        // await randAccordian.click();
        // Get a visible facet and click the checkbox
        await clickRandFacet();
      }
      // });

      // await test.step("Remove facets", async () => {
      if (!/DSK/.test(test.info().project.name)) {
        await page.locator(".filterModal.active button.modalClose").click();
      }
      const appliedFacets = hScrollList.locator("button:visible");
      for (let i = 0; i < (await appliedFacets.count()); i++) {
        await hScrollList.waitFor();
        const randFacet = await utils.getRandElement({
          page,
          selector: ".hScrollList:visible button:visible",
          scroll: false,
        });
        const facetName = await randFacet.textContent();
        await randFacet.click();
        await hScrollList.waitFor();
        expect((await hScrollList.textContent()).includes(facetName)).toBeFalsy;
      }
      // });

      async function getRandAccordian() {
        return (
          (await utils.getRandElement({
            page,
            selector: "#facetsList input.cbh:not(:checked) ~ .plpOptLbl",
            scroll: false,
          })) || "ERROR w getRandAccordian"
        );
      }

      async function clickRandAccordian() {
        // Get one of the closed accordians and open it
        const randAccordian = await getRandAccordian();
        if (typeof randAccordian == "string") {
          console.log("randAccordian not found");
        }
        if (
          (await page.locator("#facetsList").isHidden()) &&
          !/DSK/.test(test.info().project.name)
        ) {
          await page.locator("data-test=plpFilterResultsBtn").click();
          await page.waitForSelector("#facetsList .plpOpt");
        }
        if (await randAccordian.isHidden()) {
          await clickRandAccordian();
        }
        await randAccordian.click();
      }

      async function clickRandFacet() {
        const isFilterPanelOpen = await page
          .locator(
            "#facetsList .plpOptsSubOpt:has(input:not(.plpRangeIpt:checked)) >> visible=true"
          )
          .last()
          .isVisible();
        if (!isFilterPanelOpen && !/DSK/.test(test.info().project.name)) {
          await page.locator("data-test=plpFilterResultsBtn").click();
        }
        const randFacet =
          (await utils.getRandElement({
            page,
            selector:
              "#facetsList .plpOptsSubOpt:has(input:not(.plpRangeIpt:checked)) >> visible=true",
            scroll: false,
          })) || "ERROR w getRandFacet";

        if (typeof randFacet == "string") {
          console.log(colors.red("no random facet found"));
          return;
        }
        let facetName = (await randFacet.textContent()).match(
          /(.+)(?=\([0-9]+\))/
        );
        if (facetName.length)
          facetName = facetName[0].trim().replace('"', '\\"');

        if (usedFacets.indexOf(facetName) > -1) {
          return;
        } else {
          usedFacets.push(facetName);
        }
        await randFacet.click();
        await page.waitForSelector(".i-amphtml-loading-container", {
          state: "hidden",
        });

        await hScrollList.waitFor();
        const hScrollListTxt = await hScrollList.textContent();
        // const pillLocator = page.locator(
        //   `.hScrollList button:text("${facetName}")`
        // );
        const pillLocator = hScrollList
          .locator("button:visible")
          .locator(`text=${facetName}`);
        // console.log(
        //   "await hScrollList.locator('button:visible').allTextContents():",
        //   await hScrollList.locator("button:visible").allTextContents()
        // );
        expect(!(await pillLocator.count()) || (await pillLocator.isHidden()))
          .toBeTruthy;
        // expect(
        //   (await hScrollList.locator("button:visible").allTextContents()).join()
        // ).toContain(facetName);
        if (bopisClicked) {
          expect(hScrollListTxt.includes("Store Pickup")).toBeTruthy();
        }
      }
    });
    // });
  });
}

async function clickBopis(page) {
  if (await page.locator("input#prodBopisCbPwa:visible").isChecked()) return;
  const bopisCb = page.locator('.plpBopisSddBtns label[for="prodBopisCbPwa"]');

  await bopisCb.click();

  await Promise.all([
    page.waitForSelector("[data-test=bopisPill]:visible", {
      timeout: 10 * 10000,
    }),
    page.waitForTimeout(1000),
  ]);
  const [isBopisPillVisible, isSddPillVisible] = await arePillsVisible(page);

  expect(isBopisPillVisible).toBeTruthy();
  expect(isSddPillVisible).toBeFalsy();
}
async function clickSdd(page) {
  if (await page.locator("input#prodSdd:visible").isChecked()) return;
  const sddCb = page.locator('.plpBopisSddBtns label[for="prodSdd"]');

  await sddCb.click();

  await Promise.all([
    page.waitForSelector("[data-test=SddPill]:visible", {
      timeout: 10 * 10000,
    }),
    page.waitForTimeout(1000),
  ]);
  const [isBopisPillVisible, isSddPillVisible] = await arePillsVisible(page);

  expect(isBopisPillVisible).toBeFalsy();
  expect(isSddPillVisible).toBeTruthy();
}

async function arePillsVisible(page) {
  await Promise.all([
    page.waitForSelector(".plpBopisSddWrap"),
    page.waitForSelector("#plpPills .hScrollList"),
  ]);
  return await Promise.all([
    page.locator("#plpPills button.plpBopisPill").isVisible(),
    page.locator("#plpPills button.plpSddPill").isVisible(),
  ]);
}

async function goBackToPlp(page) {
  console.log("GOING BACK!");
  await page.goBack();
  await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeVisible();
}
