const { test, expect, utils } = require("../utils");
const storeIds = [
  "8002",
  "8016",
  "8027",
  "8038",
  "8041",
  "8044",
  "8050",
  "8052",
  "8053",
  "8077",
];
storeIds.forEach((id) => {
  test("check store #" + id, async ({ request }) => {
    const response = await request.get(
      `https://em02harmon-www.bbbyapp.com/apis/services/composite/product-listing/v1.0/all?start=0&q=blue&rows=48&site=HarmonUS&wt=json&storeFacet=true&qlist=blue,blue,blue,*:*&currencyCode=USD&country=US&sddAttr=13_1&piqIndex=12&slot=15005&storeId=${id}&noFacet=true&rT=xtCompat&biasingProfiles=&removeInStock=true&badge_ids=7464`
    );

    expect(response.ok()).toBeTruthy();
    expect((await response.json()).response.docs.length).toBeGreaterThan(0);
  });
});
