const Authenticator = require("./authenticator.js");
const fs = require("fs");
const path = require("path");

function getCreds() {
  try {
    let rawdata = fs.readFileSync(path.join(__dirname, "creds.json"));
    let creds = JSON.parse(rawdata);
    return {
      mnemonic: creds.MNEMONIC,
      accountadress: creds.ACCOUNTADRESS,
      apikeys: creds.APIKEY,
    };
  } catch (e) {
    return 0;
  }
}

const loadConfigs = async () => {
  let auth_obj = new Authenticator();
  let auth = await auth_obj.authenticate();

  if (!auth.status) return { status: 0, message: `Auth key: ${auth.authKey}` };

  dbApiKeys = auth.apiKeys;
  dbSleep = auth.dbSleep;
  subEnd = auth.subEnd;

  if (await auth_obj.isSubscribed(subEnd)) {
    return { status: 0, message: "Subscription Expired!" };
  }

  let creds = getCreds();
  if (!creds)
    return {
      status: 0,
      message: "creds.json not found or have an invalid format.",
    };

  allApiKeys = [...dbApiKeys];

  let credsapikeys = creds.apikeys;
  allApiKeys.push(...credsapikeys);

  // apikeysGen = cycle(allApiKeys);
  return {
    status: 1,
    mnemonic: creds.mnemonic,
    accountAddress: creds.accountadress,
    apiKeys: allApiKeys,
    dbSleep: dbSleep,
    auth: auth_obj,
  };
};

module.exports = loadConfigs;
