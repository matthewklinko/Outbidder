const getmac = require("getmac");
const { getAuth } = require("firebase/auth");
const { signInWithEmailAndPassword } = require("firebase/auth");
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, child, get, set } = require("firebase/database");
let nodeFetch = require("node-fetch");

async function getCuurentTimestamp() {
  // const options = { method: "GET" };
  // let r = await nodeFetch("https://worldtimeapi.org/api/timezone/europe/london", options);
  // let time = await r.json()
  // let timestamp = time['unixtime']*1000
  let timestamp = Date.now(); //<<comment>>
  return timestamp;
}

class Authenticator {
  firebaseConfig = {
    apiKey: "AIzaSyAvF1kFWI8OBGKSQARl8c00fHe5xXJ3QyA",
    authDomain: "opensea-bidder.firebaseapp.com",
    databaseURL: "https://opensea-bidder-default-rtdb.firebaseio.com",
    projectId: "opensea-bidder",
    storageBucket: "opensea-bidder.appspot.com",
    messagingSenderId: "80758517682",
    appId: "1:80758517682:web:2fa0a8545f4ddd66f47eab",
    measurementId: "G-9WTP9NDF8P",
  };
  callMac = () => {
    return getmac.default();
  };
  getEmailPass = () => {
    let mac = this.callMac();
    mac = mac.replace(/:/g, "");
    let email = mac + "@openbidder.com";
    return mac;
  };

  app = initializeApp(this.firebaseConfig);
  auth = getAuth(this.app);
  db = getDatabase();
  dbRef = ref(this.db);
  pass = this.getEmailPass();
  email = this.pass + "@openbidder.com";

  cipher = (text) => {
    let cipherText = "";
    const cipherDict = {
      a: "n",
      b: "z",
      c: "g",
      d: "h",
      e: "q",
      f: "k",
      g: "c",
      h: "d",
      i: "m",
      j: "y",
      k: "f",
      l: "o",
      m: "i",
      n: "a",
      o: "l",
      p: "x",
      q: "e",
      r: "v",
      s: "t",
      t: "s",
      u: "w",
      v: "r",
      w: "u",
      x: "p",
      y: "j",
      z: "b",
      A: "N",
      B: "Z",
      C: "G",
      D: "H",
      E: "Q",
      F: "K",
      G: "C",
      H: "D",
      I: "M",
      J: "Y",
      K: "F",
      L: "O",
      M: "I",
      N: "A",
      O: "L",
      P: "X",
      Q: "E",
      R: "V",
      S: "T",
      T: "S",
      U: "W",
      V: "R",
      W: "U",
      X: "P",
      Y: "J",
      Z: "B",
      0: "9",
      1: "8",
      2: "7",
      3: "6",
      4: "5",
      5: "4",
      6: "3",
      7: "2",
      8: "1",
      9: "0",
    };

    for (let c of text) cipherText += cipherDict[c];

    return cipherText;
  };

  async updateSessions(newSession) {
    let sessions = await get(
      child(this.dbRef, `${this.pass}/node_sessions/session_tokens/`)
    ).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
    });
    let newSessions = sessions.slice(1);
    newSessions.push(newSession);

    set(ref(this.db, `${this.pass}/node_sessions/session_tokens`), newSessions);
    return true;
  }
  async isSessionValid() {
    let sessions = await get(
      child(this.dbRef, `${this.pass}/node_sessions/session_tokens/`)
    ).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
    });
    return sessions.includes(this.idToken);
  }
  async isSubscribed(subEnd) {
    let now = await getCuurentTimestamp();

    return now < subEnd;
  }
  async authenticate() {
    let user = await signInWithEmailAndPassword(
      this.auth,
      this.email,
      this.pass
    )
      .then((userCredential) => {
        return userCredential;
      })
      .catch((error) => {
        return 0;
      });
    if (user) {
      this.idToken = user["_tokenResponse"]["idToken"];
      this.updateSessions(this.idToken);
      let [apiKeys, dbSleep, subEnd] = await get(
        child(this.dbRef, this.pass)
      ).then((snapshot) => {
        if (snapshot.exists()) {
          return [
            snapshot.val().apikeys,
            snapshot.val().sleep,
            snapshot.val().subEnd,
          ];
        }
      });
      return {
        status: true,
        user: user,
        apiKeys: apiKeys,
        dbSleep: dbSleep,
        subEnd: subEnd,
      };
    } else {
      let authKey = this.cipher(this.pass);
      return { status: false, authKey: authKey };
    }
  }
}

module.exports = Authenticator;
// getCuurentTimestamp().then(res=>console.log(res))
