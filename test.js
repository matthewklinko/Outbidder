const { getLatestEvents, getBidChange } = require("./opensea.js");
const loadConfigs = require("./loadConfigs.js");
const { cycle } = require("./helper.js");

async function shakeAHand(sleep) {
  await new Promise((resolve) => setTimeout(resolve, sleep));
}

async function bot() {
  let allApiKeys = (await loadConfigs()).apiKeys;
  let apiKeysCycle = cycle(allApiKeys);
  let apiKey = apiKeysCycle.next().value;
  orders = (await getLatestEvents("mutant-ape-yacht-club", apiKey))[
    "asset_events"
  ];
  for (order of orders) {
    console.log(order["asset"]["permalink"]);
    let apiKey = apiKeysCycle.next().value;
    let bidChange = await getBidChange(
      order["asset"]["permalink"],
      0.1,
      100,
      "outbid",
      apiKey
    );
    shakeAHand(3000);
    console.log(bidChange);
  }

  //   response = response["asset_events"];
  //   console.log(getTopOffer(response));
}
bot();
