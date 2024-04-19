const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("../blockchain");
const request = require("request");
const Block = require("../blockchain/block");
const PubSub = require("./pubsub");
const TransactionQueue = require("../transaction/transaction-queue");
const Account = require("../account");
const Transaction = require("../transaction");
const State = require("../store/state");

const app = express();
app.use(bodyParser.json());

const state = new State();
const blockchain = new Blockchain({ state });
const transactionQueue = new TransactionQueue();
const pubsub = new PubSub({ blockchain, transactionQueue });
const account = new Account();
const transaction = Transaction.createTransaction({ account });

//transactionQueue.add(transaction);
setTimeout(() => {
  pubsub.broadcastTransaction(transaction);
}, 500);

console.log(
  "transactionQueue.getTransactionSeries()",
  transactionQueue.getTransactionSeries()
);

app.get("/blockchain", (req, res, next) => {
  const { chain } = blockchain;

  res.json({ chain });
});

app.get("/blockchain/mine", (req, res, next) => {
  const lastBlock = blockchain.chain[blockchain.chain.length - 1];
  const block = Block.mineBlock({
    lastBlock,
    beneficiary: account.address,
    transactionSeries: transactionQueue.getTransactionSeries(),
    stateRoot: state.getStateRoot(),
  });

  blockchain
    .addBlock({ block, transactionQueue })
    .then(() => {
      pubsub.broadcastBlock(block);
      res.json({ block });
    })
    .catch(next); // equivalent next => next(error)
});

app.post("/account/transact", (req, res, next) => {
  const { to, value, code, gasLimit } = req.body;

  //If same account, then transaction done on behalf of current account owner
  const transaction = Transaction.createTransaction({
    account: !to ? new Account({ code }) : account,
    gasLimit,
    to,
    value,
  });

  //transactionQueue.add(transaction);

  pubsub.broadcastTransaction(transaction);

  res.json({ transaction });
});

app.get("/account/balance", (req, res, next) => {
  const { address } = req.query;

  const balance = Account.calculateBalance({
    address: address || account.address,
    state,
  });

  res.json({ balance });
});

app.use((err, req, res, next) => {
  console.error("Internal Server Error: ", err);

  res.status(500).json({ message: err.message });
});

const peer = process.argv.includes("--peer");

const PORT = peer ? Math.floor(2000 + Math.random() * 1000) : 3000;

if (peer) {
  request("http://localhost:3000/blockchain", (error, response, body) => {
    const { chain } = JSON.parse(body);

    blockchain
      .replaceChain({ chain })
      .then(() => {
        console.log("Synchronized blockchain with root node");
      })
      .catch((error) =>
        console.error("Synchronization Error: ", error.message)
      );
  });
}

app.listen(PORT, () => console.log(`listening at port: ${PORT}`));
