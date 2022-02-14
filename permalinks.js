let nodeFetch = require("node-fetch");
const fs = require("fs");


function cleanPermalink(permalink) {
  permalink = permalink.replace(/\n|\r/g, "");
  return permalink;
}

function arrangePermalinks(permalinks) {
  shuffledPermalinks = [];
  collectionAddresses = [];
  collections = [];
  for (let permalink of permalinks) {
    split = permalink.split("/");
    collectionAddress = split[split.length - 2];
    isCollectionAddress = collectionAddresses.indexOf(collectionAddress);
    if (isCollectionAddress === -1) {
      collectionAddresses.push(collectionAddress);
      idx = collectionAddresses.length - 1;
      collections[idx] = [];
    }
    collections[idx].push(permalink);
  }
  collectionLengths = collections.map((collection) => {
    return collection.length;
  });
  max = Math.max(...collectionLengths);
  done = collections.map((x) => {
    return 0;
  });
  for (let i = 0; i < max; i++) {
    for (let i in collections) {
      if (done[i] < collections[i].length) {
        shuffledPermalinks.push(collections[i][done[i]]);
        done[i] += 1;
      }
    }
  }
  return shuffledPermalinks;
}

async function genratePermalinksUrl(collectionUrl, start, end) {
  collectionName = collectionUrl.split("/");
  collectionName = collectionName.at(-1);
  collectionStatApi = `https://api.opensea.io/api/v1/collection/${collectionName}/stats`;
  collectionRetrievingApi =
    "https://api.opensea.io/api/v1/collection/" + collectionName;
  const options = { method: "GET" };
  collectionAddress = await nodeFetch(collectionRetrievingApi, options);
  collectionAddress = await collectionAddress.json();
  collectionAddress =
    collectionAddress["collection"]["primary_asset_contracts"][0]["address"];

  let response = await nodeFetch(collectionStatApi, options);
  response = await response.json();
  totalResults = parseInt(response["stats"]["count"].toString().split(".")[0]);
  totalResults += 1;
  token = 1;
  let permalinks = [];
  let tokenNumber;
  for (let i = start; i <= end; i++) {
    tokenNumber = i % totalResults;
    permalink = `https://opensea.io/assets/${collectionAddress}/${tokenNumber}`;
    permalinks.push(permalink);
  }
  permalinks = permalinks.filter(function (item, pos, self) {
    return self.indexOf(item) == pos;
  });
  return permalinks;
}

async function genratePermalinksFile(filename) {
  const readFileLines = (filename) =>
    fs.readFileSync(filename).toString("UTF8").split("\n");
  let permalinks = readFileLines(filename);

  permalinks = permalinks.map((permalink) => { return cleanPermalink(permalink) });
  permalinks = permalinks.filter(function(item) { return item !== ""; })
  
  return permalinks;
}

async function genratePermalinks(filename, url, range, arrangePermalinks) {
  let permalinks;
  if (filename) {
    permalinks = await genratePermalinksFile(filename);
    if (arrangePermalinks) permalinks = arrangePermalinks(permalinks);
  }
  else {
    range = range.split("-");
    start = parseInt(range[0]);
    end = parseInt(range[1]);
    permalinks = await genratePermalinksUrl(url, start, end);
  }

  permalinks = permalinks.map( permalink => {
    return { permalink: permalink, status: "ready" };
  });
  return permalinks
}

module.exports = genratePermalinks
