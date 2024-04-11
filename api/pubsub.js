const PubNub = require("pubnub");

const credentials = {
  publishKey: "pub-c-fa1635f1-4236-4016-b1a9-83075bc9feb4",
  subscribeKey: "sub-c-30e03e90-139c-4a61-8df0-2bd62539c9c8",
  secretKey: "sec-c-MGM5MzhlMjctZTA2Mi00OWNmLWEyN2YtZTMxN2I0NDNmZTNk",
  userId: "SubinUser",
};

const CHANNELS_MAP = {
  TEST: "TEST",
  BLOCK: "BLOCK",
};

class PubSub {
  constructor({ blockchain }) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
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
              })
              .then(() => {
                console.log("New Block Accepted");
              })
              .catch((e) => {
                console.error("New Block Rejected: ", e.message);
              });

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
}

module.exports = PubSub;

// const pubsub = new PubSub();

// setTimeout(() => {
//   pubsub.publish({
//     channel: CHANNELS_MAP.TEST,
//     message: "foo",
//   });
// }, 3000);
