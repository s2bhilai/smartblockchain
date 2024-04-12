const request = require("request");

const BASE_URL = "http://localhost:3000";

const postTransact = ({ to, value }) => {
  return new Promise((resolve, reject) => {
    request(
      `${BASE_URL}/account/transact`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, value }),
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

postTransact({})
  .then((postTransactResponse) => {
    console.log(
      "postTransactionResponse (Create Account Transaction) : ",
      postTransactResponse
    );

    const toAccountData = postTransactResponse.transaction.data.accountData;
    console.log("toAccountData.address::", toAccountData.address);

    return postTransact({ to: toAccountData.address, value: 20 });
  })
  .then((postTransactResponse2) => {
    console.log(
      "postTransactResponse2 (Standard Transaction) : ",
      postTransactResponse2
    );

    return getMine();
  })
  .then((getMineResponse) => {
    console.log("getMineResponse: ", getMineResponse);
  });

// postTransact({ to: "foo-recipient", value: 20 }).then(
//   (postTransactionResponse) => {
//     console.log(
//       "postTransactionResponse (Standard Transaction) : ",
//       postTransactionResponse
//     );
//   }
// );
