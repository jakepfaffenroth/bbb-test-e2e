const { test, expect, ...utils } = require("../utils");
const plpExamples = require("../json/plpExamples.json");

for (const example in plpExamples) {
  test.describe.parallel(example, () => {
    test.beforeEach(async ({ page }) => {
      // test.skip(!/DSK/.test(test.info().project.name));
      // test.skip(!/MOB/.test(test.info().project.name));
      const url = plpExamples[example];
      test.slow();
      await utils.init({ page, url });
    });

    test("Flow: ATC", async ({ page }) => {
      let selectedCard = await utils.getRandElement({
        page,
        // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
        selector: '.prodCard:has(.plpAtc:text-matches("Add to Cart", "i"))',
      });

      test.skip(
        selectedCard == "NONE_FOUND",
        "No prodCards found with ATC btn."
      );

      const cartCount = page.locator("#cartCount");
      const cartCountBefore = Number(await cartCount.textContent());

      await selectedCard.locator("text=Add to Cart").click();
      await page.waitForLoadState("load", { timeout: 60 * 1000 });
      await page.waitForTimeout(3000);

      const modalCart = page.locator(".modalCart");
      const cartCountAfter = Number(await cartCount.textContent());
      await expect(modalCart).toBeVisible();
      await modalCart.locator("button.modalClose").click();
      expect(cartCountAfter).toEqual(cartCountBefore + 1);
    });

    test("Flow: Choose Options", async () => {
      selectedCard = await utils.getRandElement({
        page,
        // Selects from all .prodCard with a descendant that contains the regex match "Add to Cart"
        selector: '.prodCard:has(.plpAtc:text-matches("Choose Options", "i"))',
      });
      test.skip(
        selectedCard == "NONE_FOUND",
        "No prodCards found with Choose Options btn."
      );
      await utils.waitAfterPdpSoftNav(page);
      await expect(page.locator("#wmHostPdp body.amp-shadow")).toBeVisible();
      await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeHidden();
    });

    test("Flow: PLP->PDP", async ({ page }) => {
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
    });

    test("Pagination", async ({ page }) => {
      // const landingUrl = page.url();

      const firstProdCard = page.locator(".prodCard").first();
      let comparisonCardId = await firstProdCard.getAttribute("id");
      let selectedCardId;
      let pageCur, pageNext, pagePrev;

      await ({ pageCur, pageNext } = await utils.pagination.next(page));

      expect(pageNext).toEqual(pageCur + 1);
      await compareFirstProdCardIds();

      await ({ pageCur, pageNext } = await utils.pagination.next(page));

      expect(pageNext).toEqual(pageCur + 1);
      await compareFirstProdCardIds();

      await ({ pageCur, pagePrev } = await utils.pagination.prev(page));

      expect(pagePrev).toEqual(pageCur - 1);
      await compareFirstProdCardIds();

      await ({ pageCur, pagePrev } = await utils.pagination.prev(page));

      expect(pagePrev).toEqual(pageCur - 1);
      await compareFirstProdCardIds();

      async function compareFirstProdCardIds() {
        selectedCardId = await firstProdCard.getAttribute("id");
        expect(selectedCardId).not.toEqual(comparisonCardId);
        comparisonCardId = selectedCardId;
      }
    });

    test("Toggle Pickup and SDD filters", async ({ page }) => {
      test.slow(false);
      test.setTimeout(30 * 1000);
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

    test("Apply various filters", async ({ page }) => {
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
      await page.waitForSelector("#facetsList");
      const hScrollList = page.locator(".hScrollList:visible");

      const usedFacets = [];
      await test.step("Apply facets", async () => {
        for (let i = 0; i < 3; i++) {
          // Get one of the closed accordians and open it
          const randAccordian = await getRandAccordian();
          if (typeof randAccordian == String) {
            console.log("randAccordian not found");
          }
          await randAccordian.click();
          // Get a visible facet and click the checkbox
          await clickRandFacet();
        }
      });

      await test.step("Remove facets", async () => {
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
          expect((await hScrollList.textContent()).includes(facetName))
            .toBeFalsy;
        }
      });

      async function getRandAccordian() {
        return (
          (await utils.getRandElement({
            page,
            selector: "#facetsList input.cbh:not(:checked) ~ .plpOptLbl",
            scroll: false,
          })) || "ERROR w getRandAccordian"
        );
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

        if (typeof randFacet == String) await page.pause();
        let facetName = (await randFacet.textContent()).match(
          /(.+)(?=\([0-9]+\))/
        );
        if (facetName.length)
          facetName = facetName[0].trim().replace('"', '\\"');
        console.log(
          "await randFacet.textContent():",
          await randFacet.textContent()
        );
        console.log("facetName:", facetName);

        if (usedFacets.indexOf(facetName) > -1) {
          return;
        } else if (typeof randFacet == String) {
          console.log(colors.red("no random facet found"));
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
        const pillLocator = page.locator(
          `.hScrollList button:text('${facetName}')`
        );
        console.log(
          "await hScrollList.locator('button:visible').allTextContents():",
          await hScrollList.locator("button:visible").allTextContents()
        );
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
  });
}

async function clickBopis(page) {
  if (await page.locator("input#prodBopisCbPwa").isChecked()) return;
  const bopisCb = page.locator('.plpBopisSddBtns label[for="prodBopisCbPwa"]');

  await bopisCb.click();

  const [isBopisPillVisible, isSddPillVisible] = await arePillsVisible(page);
  await Promise.all([
    page.waitForSelector("[data-test=bopisPill]:visible"),
    page.waitForTimeout(3000),
  ]);

  expect(isBopisPillVisible).toBeTruthy();
  expect(isSddPillVisible).toBeFalsy();
}
async function clickSdd(page) {
  if (await page.locator("input#prodSdd").isChecked()) return;
  const sddCb = page.locator('.plpBopisSddBtns label[for="prodSdd"]');

  await sddCb.click();

  const [isBopisPillVisible, isSddPillVisible] = await arePillsVisible(page);
  await Promise.all([
    page.waitForSelector("[data-test=SddPill]:visible"),
    page.waitForTimeout(3000),
  ]);

  expect(isBopisPillVisible).toBeFalsy();
  expect(isSddPillVisible).toBeTruthy();
}

async function arePillsVisible(page) {
  await Promise.all([
    page.waitForSelector(".plpBopisSddWrap"),
    page.waitForSelector("#plpPills .hScrollList"),
  ]);
  return await Promise.all([
    await page.locator('#plpPills button:has-text("Store Pickup")').isVisible(),
    await page
      .locator('#plpPills button:has-text("Same Day Delivery")')
      .isVisible(),
  ]);
}
