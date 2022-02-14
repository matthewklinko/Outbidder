const path = require('path');
const fs = require("fs");


let incrementBidCalculate = (topOffer, percentageIncrease) => {
    let bidPrice = topOffer * percentageIncrease;
    let increaseBidPrice = topOffer + bidPrice;
    return increaseBidPrice;
  };
  
  let decrementBidCalculate = (topOffer, percentageIncrease) => {
    let bidPrice = topOffer * percentageIncrease;
    let decreaseBidPrice = topOffer - bidPrice;
    return decreaseBidPrice;
  };

  function allComplete(permalinks){
    for(let permalink of permalinks){
      if(permalink.status !== 'complete') return false
    }
    return true
  }
  
  function countRemaining(permalinks){
    let count = 0;
    for(let permalink of permalinks){
      if (permalink.status == 'ready') count++;
    }
    return count;
  }
  
  function* cycle(vals) {
    let len = vals.length;
    let i = 0;
    while (true) {
      yield vals[i % len];
      i++;
    }
  }

  function getPaymentTokenAddress(paymentToken) {
    if (paymentToken === "Gala") {
      return "0x15D4c048F83bd7e37d49eA4C83a07267Ec4203dA";
    } else if (paymentToken === "Dai") {
      return "0x6b175474e89094c44da98b954eedeac495271d0f";
    } else if (paymentToken === "Usdc") {
      return "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    } else if (paymentToken === "Weth") {
      return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    } else if (paymentToken === "Mana") {
      return "0x0f5d2fb29fb7d3cfee444a200298f468908cc942";
    }
  }



  async function shakeAHand(sleep) {
    await new Promise((resolve) => setTimeout(resolve, sleep));
  }

  function convertBidTime(bidExpirationTime, bidExpirationFormat){
    let time;
    if (bidExpirationFormat === "minutes") {
      time = Math.floor(bidExpirationTime * 60);
    } else if (bidExpirationFormat === "hours") {
      time = Math.floor(bidExpirationTime * 3600);
    } else if (bidExpirationFormat === "days") {
      time = Math.floor(bidExpirationTime / 86400);
    }
    return time
  }

  function getBidTime(time) {
    const bidTime = Math.round(Date.now() / 1000 + time);
    return bidTime;
  }

  function breakPermalink(permalink) {
    let tokenAddress = permalink.split("/").slice(-2)[0];
    let tokenId = permalink.split("/").slice(-1)[0];
    return [tokenAddress, tokenId];
  }
  module.exports = {
    incrementBidCalculate,
    decrementBidCalculate,
    allComplete,
    countRemaining,
    cycle,
    getPaymentTokenAddress,
    shakeAHand,
    convertBidTime,
    getBidTime,
    breakPermalink
  }
