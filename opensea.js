const nodeFetch = require("node-fetch");
const {
  incrementBidCalculate,
  decrementBidCalculate,
  breakPermalink,
} = require("./helper.js");

async function getCollectionDetail(permalink, apiKey) {
  tokenAddress = permalink.split("/").slice(-2)[0];
  tokenId = permalink.split("/").slice(-1)[0];
  const options = {
    method: "GET",
    headers: { "x-api-key": apiKey },
  };
  let response = await nodeFetch(
    "https://api.opensea.io/api/v1/asset/" + tokenAddress + "/" + tokenId,
    options
  );

  response = await response.json();
  slug = response["collection"]["slug"];
  imageUrl = response["collection"]["image_url"];
  return [slug, imageUrl];
}

async function getLatestEvents(slug, apiKey) {
  const options = {
    method: "GET",
    headers: { "x-api-key": apiKey },
  };
  let response = await nodeFetch(
    "https://api.opensea.io/api/v1/events?collection_slug=" +
      slug +
      "&event_type=offer_entered&only_opensea=false",
    options
  );
  response = await response.json();
  response = response["asset_events"];
  let permalinks = [];
  response.forEach((response) => {
    permalinks.push(response["permalink"]);
  });
  return permalinks;
}

function getTopOffer(response) {
  if (String(response["orders"]) === String([])) return null;
  let orders = response["orders"];
  orders = orders.filter((order) => {
    return order["payment_token_contract"]["symbol"] == "WETH";
  });
  if (orders.length === 0) return null;
  let wethAmounts = orders.map((order) => {
    return parseFloat(order["current_price"]) / 1000000000000000000;
  });
  wethAmounts = wethAmounts.sort((a, b) => {
    return a - b;
  });
  console.log(wethAmounts);
  console.log(typeof wethAmounts);
  return wethAmounts[wethAmounts.length - 1];
}

function getCurrentPrice(response) {
  if (String(response["orders"]) === String([])) return null;

  let orders = response["orders"];
  orders = orders.filter((order) => {
    return order["payment_token_contract"]["symbol"] == "ETH";
  });
  if (orders.length === 0) return null;
  let wethAmounts = orders.map((order) => {
    return parseFloat(order["current_price"]) / 1000000000000000000;
  });
  wethAmounts = wethAmounts.sort((a, b) => {
    return a - b;
  });
  // console.log(wethAmounts)
  return wethAmounts[0];
}

//<<prev>>getData<</prev>>
async function getBidChange(
  permalink,
  percentageChange,
  bidCap,
  bidtype,
  apiKey
) {
  let [tokenAddress, tokenId] = breakPermalink(permalink);
  console.log(
    "https://api.opensea.io/api/v1/asset/" + tokenAddress + "/" + tokenId
  );
  const options = {
    method: "GET",
    headers: { "x-api-key": apiKey },
  };
  let response = await nodeFetch(
    "https://api.opensea.io/api/v1/asset/" + tokenAddress + "/" + tokenId,
    options
  );
  response = await response.json();
  console.log(response["sell_orders"]);
  console.log(response["permalink"]);
  // response = response["assets"];assets

  if (
    !response["sell_orders"] ||
    response["sell_orders"][0]["closing_date"] === null ||
    response["sell_orders"][0]["closing_extendable"] === false
  ) {
  } else {
    return { bidChange: -1, reason: "Make offer not available." };
  }

  let topOffer = getTopOffer(response);
  // let currentPrice = getCurrentPrice(response);
  // console.log(tokenId);
  // console.log("currentPrice", currentPrice);

  if (topOffer === null)
    return { bidChange: 0, reason: "No offers available." };
  // if (currentPrice === null)
  //   return { bidChange: 0, reason: "Current Price not available." };

  let bidChange;
  if (bidtype === "outbid") {
    bidChange = incrementBidCalculate(topOffer, percentageChange);
  } else if (bidtype === "underbid") {
    bidChange = decrementBidCalculate(currentPrice, percentageChange);
  }
  console.log("bidChange", bidChange);
  if (bidChange > bidCap)
    return { bidChange: -1, reason: "Bid cap surpassed." };
  bidChange = bidChange.toFixed(4);
  console.log(
    "Previous bid was: ",
    topOffer,
    ` Percentage to be ${bidtype}:`,
    percentageChange,
    " Incremented bid: ",
    bidChange
  );

  return { bidChange: bidChange };
}

module.exports = {
  getCollectionDetail,
  getBidChange,
  getLatestEvents,
  getTopOffer,
};
