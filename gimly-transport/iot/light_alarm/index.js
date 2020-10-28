const PIN = require("rpi-pins");
const GPIO = new PIN.GPIO();
// Rpi-pins uses the WiringPi pin numbering system (check https://pinout.xyz/pinout/pin16_gpio23)
GPIO.setPin(4, PIN.MODE.INPUT);
GPIO.pullControl(4, PIN.MODE.PULL_UP);

const LightAlarmTransaction = require('./light-alarm');
const { APIClient } = require('@liskhq/lisk-api-client');
const {getNetworkIdentifier} = require('@liskhq/lisk-cryptography');

const networkIdentifier = getNetworkIdentifier(
	"23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
	"Lisk",
);
// Enter here the IP of the node you want to reach for API requests
// Check the IP by running `ifconfig` inside your local terminal
// const api = new APIClient(['http://localhost:4000']);
const api = new APIClient(['http://192.168.150.96:4000']);

// Check config file or curl localhost:4000/api/node/constants to verify your epoc time (OK when using /transport/node/index.js)
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);

/* Note: Always update to the package you are using */
// const packetCredentials = {
//   "address": "11977007703588249387L",
//   "passphrase": "truth layer reward boil fly drink actual toast sport rally when biology",
//   "publicKey": "7d7beafa9fdb9ea2c57a09ad52f1f82e13458e02d7812a653bd4d2114c276fce",
//   "privateKey": "9d183e1acad8780611a1b6589c2da4e7c0d85af095928e5cc14adc86b85861b47d7beafa9fdb9ea2c57a09ad52f1f82e13458e02d7812a653bd4d2114c276fce"
// };
const packetCredentials = {
  "address": "11960798290459456949L",
  "passphrase": "earth rose option install jeans absurd grid shield marble beef deputy danger",
  "publicKey": "3e0373be705cb2c9a2ef533ed2ceaf36c5ec8c5f60668b3b2650a3ef6260a83d",
  "privateKey": "7175ea715dad8971217619d39b95fc79cd0186b7295f0572a8ee787cfe3dfbc93e0373be705cb2c9a2ef533ed2ceaf36c5ec8c5f60668b3b2650a3ef6260a83d"
}

setInterval(() => {
	let state = GPIO.read(4);
	console.log("got state %s / %s", new Date(), state)
	if(state === 0) {
		console.log('Package has been opened! Send lisk transaction!');
		// Uncomment the below code in step 1.3 of the workshop
        let tx =  new LightAlarmTransaction({
            timestamp: dateToLiskEpochTimestamp(new Date()),
            networkIdentifier: networkIdentifier
        });
				
				console.log(tx);
				
        tx.sign(packetCredentials.passphrase);
				
        api.transactions.broadcast(tx.toJSON()).then(res => {
            console.log("++++++++++++++++ API Response +++++++++++++++++");
            console.log(res.data);
            console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
            console.log(tx.stringify());
            console.log("++++++++++++++++ End Script +++++++++++++++++");
        }).catch(err => {
            console.dir(err);
        });
	} else {
		console.log('Alles gut');
	}
}, 1000);

