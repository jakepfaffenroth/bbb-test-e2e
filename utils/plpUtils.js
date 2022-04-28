require("dotenv").config();
const base = require("@playwright/test");
const expect = base.expect;
const colors = require("colors/safe");
const setup = require("../setup/networkController");

class PlpUtils {
  /**
   * If the bopis checkbox in PLP left filters is unchecked, click it.
   * Wait for bopis filter pill to appear and assert the bopis is visible and sdd pill is not
   * @param {object} page Page fixture object
   * @returns undefined
   */
  clickBopis = async function (page) {
    if (await page.locator("input#prodBopisCbPwa").isChecked()) return;
    const bopisCb = page.locator(
      '.plpBopisSddBtns label[for="prodBopisCbPwa"]'
    );

    await bopisCb.click();

    await Promise.all([
      page.waitForSelector("[data-test=bopisPill]:visible", {
        timeout: 10 * 10000,
      }),
      page.waitForTimeout(5000),
    ]);
    const [isBopisPillVisible, isSddPillVisible] = await this.arePillsVisible(page);

    expect(isBopisPillVisible).toBeTruthy();
    expect(isSddPillVisible).toBeFalsy();
  };

  /**
   * If the SDD checkbox in PLP left filters is unchecked, click it.
   * Wait for SDD filter pill to appear and assert that SDD pill is visible and bopis pill is not
   * @param {object} page Page fixture object
   * @returns undefined
   */
  clickSdd = async function (page) {
    if (await page.locator("input#prodSdd").isChecked()) return;
    const sddCb = page.locator('.plpBopisSddBtns label[for="prodSdd"]');

    await sddCb.click();

    await Promise.all([
      page.waitForSelector("[data-test=SddPill]:visible", {
        timeout: 10 * 10000,
      }),
      page.waitForTimeout(5000),
    ]);
    const [isBopisPillVisible, isSddPillVisible] = await this.arePillsVisible(page);

    expect(isBopisPillVisible).toBeFalsy();
    expect(isSddPillVisible).toBeTruthy();
  };

  arePillsVisible = async function (page) {
    await Promise.all([
      page.waitForSelector(".plpBopisSddWrap"),
      page.waitForSelector("#plpPills .hScrollList"),
    ]);
    return await Promise.all([
      page.locator("#plpPills button.plpBopisPill").isVisible(),
      page.locator("#plpPills button.plpSddPill").isVisible(),
    ]);
  };
}

const plpUtils = new PlpUtils();

module.exports = { plpUtils };
