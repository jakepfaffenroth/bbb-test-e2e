const { test, expect, ...utils } = require("../utils");
const plpExamples = require("../json/plpExamples.json");

for (const example in plpExamples) {
  test.describe.parallel(example, () => {
    test.beforeEach(async ({ page }) => {
      const url = plpExamples[example];
      test.slow();
      await utils.init({ page, url });
    });

    test("Flow: ATC", async ({ page }) => {
      let selectedCard = await utils.getRandPlpCard({
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
      selectedCard = await utils.getRandPlpCard({
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
      const selectedCard = await utils.getRandPlpCard({ page });
      test.skip(selectedCard == "NONE_FOUND", "No prodCards found.");
      const cardTitleLocator = selectedCard.locator("a.plpProdTitle");

      page.waitForNavigation();
      await cardTitleLocator.click();

      await utils.waitAfterPdpSoftNav(page);

      await expect(page.locator("#wmHostPdp body.amp-shadow")).toBeVisible();
      await expect(page.locator("#wmHostPrimary body.amp-shadow")).toBeHidden();
    });

    test("Pagination", async ({ page }) => {
      const landingUrl = page.url();
      // const nextPageBtn = page.locator("data-test=plpPaginationNext");
      // const prevPageBtn = page.locator("button.plpPrev");
      // // The page numbers have data-test="plpPaginationBack", not the prev button
      // const pageNumberEl = page.locator("data-test=plpPaginationBack");

      // async function pageNext() {
      //   const pageNumberCur = Number(
      //     (await pageNumberEl.textContent())
      //       // .join(" ")
      //       .match(/([0-9]+)/)[0]
      //   );
      //   console.log("pageNumberCur:", pageNumberCur);
      //   await nextPageBtn.scrollIntoViewIfNeeded();
      //   await nextPageBtn.click();
      //   const pageNumberNext = Number(
      //     (await pageNumberEl.textContent())
      //       // .join(" ")
      //       .match(/([0-9]+)/)[0]
      //   );
      //   console.log("pageNumberNext:", pageNumberNext);
      //   expect(pageNumberNext).toEqual(pageNumberCur + 1);
      // }
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
  });
}
