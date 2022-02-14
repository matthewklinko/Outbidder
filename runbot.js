const opensea = require("opensea-js");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const parse = require("csv-parse");
const request = require("request");
const Authenticator = require("./authenticator.js");
let nodeFetch = require("node-fetch");
const { stat } = require("fs/promises");
const { getBidChange } = require("./opensea.js");
const {
  allComplete,
  countRemaining,
  cycle,
  getPaymentTokenAddress,
  shakeAHand,
  getBidTime,
  breakPermalink,
} = require("./helper.js");
// let prompt = require("prompt-sync")({ sigint: true });
var PAUSE = false;

async function makeOffer(
  token,
  tokenAddress,
  paymentTokenAddress,
  accountAddress,
  bidPrice,
  expirationTime,
  seaport
) {
  let asset = "https://opensea.io/assets/" + tokenAddress + "/" + token;

  console.log('asset', asset)

  const offer = await seaport
    .createBuyOrder({
      asset: {
        tokenId: token,
        tokenAddress: tokenAddress,
      },
      accountAddress: accountAddress,
      startAmount: bidPrice,
      expirationTime: expirationTime,
      paymentTokenAddress: paymentTokenAddress,
    })
    .then((val) => {
      return { status: true, asset: asset };
    })
    .catch((val) => {
      console.log(val);

      let errorCode;
      let errMessage = val.message.toLowerCase();
      if (errMessage.includes("insufficient balance")) errorCode = 1;
      else if (errMessage.includes("outstanding")) errorCode = 2;
      else if (errMessage.includes("throttle")) errorCode = 3;
      else errorCode = -1;

      return { status: false, errorCode: errorCode };
    });
  return offer;
}

async function runbot(
  accountAddress,
  mnemonic,
  paymentToken,
  permalinks,
  allApiKeys,
  bidCap,
  percentageChange,
  expiration,
  bidPrice,
  bidtype,
  dbSleep,
  auth,
  progress,
  showMessage
) {
  console.log("RUNNING");
  let sleep;
  apiKeysCycle = cycle(allApiKeys);
  const OpenSeaPort = opensea.OpenSeaPort;
  const Network = opensea.Network;

  // Connect to wallet
  const provider = new HDWalletProvider({
    mnemonic: {
      phrase: mnemonic,
    },
    providerOrUrl:
      "wss://mainnet.infura.io/ws/v3/9aa3d95b3bc440fa88ea12eaa4456161", 
  });
  let seaportObjects = allApiKeys.map((api) => {
    return new OpenSeaPort(provider, {
      networkName: Network.Main,
      apiKey: api,
    });
  });



  seaportObjects = cycle(seaportObjects);
  paymentTokenAddress = getPaymentTokenAddress(paymentToken);
  let totalTokens = permalinks.length;

  percentageChange = percentageChange / 100;
  let ind = 0;
  let initial = true;
  while (true) {
    if (!(await auth.isSessionValid())) {
      showMessage("Session Overflow.");
      return 0;
    }
    if (initial) {
      initial = false;
    } else {
      if (!Object.is(percentageChange, NaN)) await shakeAHand(sleep);
      else await shakeAHand(dbSleep);
    }

    while (PAUSE) {
      await shakeAHand(1000);
    }
    let permalinkObj = permalinks[ind];
    let permalink = permalinkObj.permalink;
    let [tokenAddress, tokenId] = breakPermalink(permalink);
    ind = ++ind % permalinks.length;

    if (allComplete(permalinks)) {
      break;
    } else if (
      permalinkObj.status === "complete" ||
      permalinkObj.status === "pending"
    ) {
      continue;
    }

    let bidExpiry = getBidTime(expiration);
    let seaport = seaportObjects.next().value;
    if (percentageChange) {
      let timeBefore = Date.now();
      //<<replace>>change outbid to bid change and token details to -1, price scheme<</replace>>
      let apiKey = apiKeysCycle.next().value;
      let bidChange = await getBidChange(
        permalink,
        percentageChange,
        bidCap,
        bidtype,
        apiKey
      );
      changePrice = bidChange.bidChange
      if (changePrice === -1) {
        permalinkObj.status = 'complete'
        console.log(bidChange.reason)
        // progress(response.asset, completed, totalTokens);
        continue
      }
      else if (changePrice !== 0){
        bidPrice = bidChange.bidChange
      }
      
      let timeAfter = Date.now();
      sleep = dbSleep - (timeAfter - timeBefore);
      sleep = sleep > 0 ? sleep : 0;
    }

    let statusPending;
    permalinkObj.status = "pending";
    let artRemains = countRemaining(permalinks);
    let completed = totalTokens - artRemains;

    try {
      console.log("Weth Offer  --  ", bidPrice);

      statusPending = makeOffer(
        tokenId,
        tokenAddress,
        paymentTokenAddress,
        accountAddress,
        bidPrice,
        bidExpiry,
        seaport
      );
    } catch (e) {
      // permalinks.push(permalink)
    }

    statusPending.then((response) => {
      success = response.status;
      console.log("success - ", success);

      if (success || response.errorCode === 3) {
        progress(response.asset, completed, totalTokens); //<<complete parameters>>
        permalinkObj.status = "complete";
      } else {
        console.log("Offer unsuccesful");
        permalinkObj.status = "ready";
        let message;
        switch (response.errorCode) {
          case 1:
            message = "Insufficient balance.";
            break;
          case 2:
            message = "Outstanding bid error";
            break;
          default:
            message = null;
        }
        if (message) showMessage(message);
      }
    });
  }
}

function changePause() {
  PAUSE = PAUSE ? false : true;
}
module.exports = { runbot, changePause };
