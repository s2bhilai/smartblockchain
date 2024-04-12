const PubNub = require("pubnub");
const Transaction = require("../transaction");

const credentials = {
  publishKey: "pub-c-fa1635f1-4236-4016-b1a9-83075bc9feb4",
  subscribeKey: "sub-c-30e03e90-139c-4a61-8df0-2bd62539c9c8",
  secretKey: "sec-c-MGM5MzhlMjctZTA2Mi00OWNmLWEyN2YtZTMxN2I0NDNmZTNk",
  userId: "SubinUser",
};

const CHANNELS_MAP = {
  TEST: "TEST",
  BLOCK: "BLOCK",
  TRANSACTION: "TRANSACTION",
};

class PubSub {
  constructor({ blockchain, transactionQueue }) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
    this.transactionQueue = transactionQueue;
    this.subscribeToChannels();
    this.listen();
  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: Object.values(CHANNELS_MAP),
    });
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }

  listen() {
    this.pubnub.addListener({
      message: (messageObject) => {
        const { channel, message } = messageObject;
        const parsedMessage = JSON.parse(message);

        console.log("Message Received. channel: ", channel);

        switch (channel) {
          case CHANNELS_MAP.BLOCK:
            console.log("block message: ", message);

            this.blockchain
              .addBlock({
                block: parsedMessage,
                transactionQueue: this.transactionQueue,
              })
              .then(() => {
                console.log("New Block Accepted:", parsedMessage);
              })
              .catch((e) => {
                console.error("New Block Rejected: ", e.message);
              });

            break;
          case CHANNELS_MAP.TRANSACTION:
            console.log(`Received Transaction: ${parsedMessage.id}`);
            console.log(parsedMessage);

            this.transactionQueue.add(new Transaction(parsedMessage));
            console.log(
              "this.transactionQueue.getTransactionSeries()",
              this.transactionQueue.getTransactionSeries()
            );

            break;
          default:
            return;
        }
      },
    });
  }

  broadcastBlock(block) {
    this.publish({
      channel: CHANNELS_MAP.BLOCK,
      message: JSON.stringify(block),
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS_MAP.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;

// const pubsub = new PubSub();

// setTimeout(() => {
//   pubsub.publish({
//     channel: CHANNELS_MAP.TEST,
//     message: "foo",
//   });
// }, 3000);
