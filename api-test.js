const request = require("request");

const BASE_URL = "http://localhost:3000";

const { OPCODE_MAP } = require("./interpreter");
const { STOP, ADD, PUSH } = OPCODE_MAP;

const postTransact = ({ to, value, code, gasLimit }) => {
  return new Promise((resolve, reject) => {
    request(
      `${BASE_URL}/account/transact`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, value, code, gasLimit }),
      },
      (error, response, body) => {
        return resolve(JSON.parse(body));
      }
    );
  });
};

const getMine = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      request(`${BASE_URL}/blockchain/mine`, (error, response, body) => {
        return resolve(JSON.parse(body));
      });
    }, 1000);
  });
};

const getAccountBalance = ({ address } = {}) => {
  return new Promise((resolve, reject) => {
    request(
      `${BASE_URL}/account/balance` + (address ? `?address=${address}` : ""),
      (error, response, body) => {
        return resolve(JSON.parse(body));
      }
    );
  });
};

let toAccountData;
let smartContractAccountData;

postTransact({})
  .then((postTransactResponse) => {
    console.log(
      "postTransactionResponse (Create Account Transaction) : ",
      postTransactResponse
    );

    toAccountData = postTransactResponse.transaction.data.accountData;
    console.log("toAccountData.address::", toAccountData.address);

    return getMine();
  })
  .then((getMineResponse) => {
    console.log("getMineResponse: ", getMineResponse);
    return postTransact({ to: toAccountData.address, value: 20 });
  })
  .then((postTransactResponse2) => {
    console.log(
      "postTransactResponse2 (Standard Transaction) : ",
      postTransactResponse2
    );

    const code = [PUSH, 4, PUSH, 5, ADD, STOP];

    return postTransact({ code });
  })
  .then((postTransactResponse3) => {
    console.log(
      "postTransactResponse3 (Smart Contract) : ",
      postTransactResponse3
    );

    smartContractAccountData =
      postTransactResponse3.transaction.data.accountData;

    console.log("smartContractAccountData: ", smartContractAccountData);

    return getMine();
  })
  .then((getMineResponse2) => {
    console.log("getMineResponse2: ", getMineResponse2);

    return postTransact({
      to: smartContractAccountData.codeHash,
      value: 0,
      gasLimit: 100,
    });
  })
  .then((postTransactResponse4) => {
    console.log(
      "postTransactResponse4 (to the Smart Contract) : ",
      postTransactResponse4
    );

    console.log(
      "postTransactResponse4: ",
      postTransactResponse4.transaction.data.accountData
    );

    return getMine();
  })
  .then((getMineResponse3) => {
    console.log("getMineResponse3: ", getMineResponse3);
    return getAccountBalance();
  })
  .then((getAccountBalanceResponse) => {
    console.log("getAccountBalanceResponse: ", getAccountBalanceResponse);

    return getAccountBalance({ address: toAccountData.address });
  })
  .then((getAccountBalanceResponse2) => {
    console.log("getAccountBalanceResponse2: ", getAccountBalanceResponse2);
  });

// postTransact({ to: "foo-recipient", value: 20 }).then(
//   (postTransactionResponse) => {
//     console.log(
//       "postTransactionResponse (Standard Transaction) : ",
//       postTransactionResponse
//     );
//   }
// );
