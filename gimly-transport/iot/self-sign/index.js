const cryptography = require('@liskhq/lisk-cryptography');
const LightAlarmTransaction = require('./light-alarm.js');
const { APIClient } = require('@liskhq/lisk-api-client');
const transactions = require('@liskhq/lisk-transactions');
const { getReader, getActivecardData, signDataUsingActiveCard } = require('./nfc-reader');

const networkIdentifier = cryptography.getNetworkIdentifier(
	"23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
	"Lisk",
);

// Enter here the IP of the node you want to reach for API requests
// Check the IP by running `ifconfig` inside your local terminal
const api = new APIClient(['http://localhost:4000']);

// Check config file or curl localhost:4000/api/node/constants to verify your epoc time (OK when using /transport/node/index.js)
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);

const doMeasurements = async () => {
	try {
		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
		let reader = getReader();
		if(false!==reader) {
			let activeCardData = getActivecardData()
			let pubkey = activeCardData.WalletPublicKey;
			
			// https://lisk.io/documentation/lisk-sdk/references/lisk-elements/cryptography.html#_getaddressfrompublickey
			console.log("sensor hardware wallet address is %s", cryptography.getAddressFromPublicKey(pubkey));
			let tx = new LightAlarmTransaction({
          timestamp: dateToLiskEpochTimestamp(new Date()),
          networkIdentifier: networkIdentifier,
					senderPublicKey: pubkey.toString('hex')
      });
			
			const networkIdentifierBytes = cryptography.hexToBuffer(networkIdentifier);
			const transactionWithNetworkIdentifierBytes = Buffer.concat([
						networkIdentifierBytes,
						tx.getBytes(),
					]);

			// code below demonstrates two ways to sign the transaction:
			if(false) {
				// hash & sign raw data on the card
				const datatosign = transactionWithNetworkIdentifierBytes;
				console.log("got data to sign %s", datatosign.toString('hex'))
				tx._signature = await signDataUsingActiveCard(datatosign, true);
			} else {
				// only sign hash on the card
				const datatosign = cryptography.hash(transactionWithNetworkIdentifierBytes)
				console.log("got data to sign %s", datatosign.toString('hex'))
				tx._signature = await signDataUsingActiveCard(datatosign, false);
			}

			if(false!==tx._signature) {
				// debug code: use verify function to check signature
				// console.log(tx.validate());
				tx._id = transactions.utils.getId(tx.getBytes());
				try {
					let res = await api.transactions.broadcast(tx.toJSON());
          console.log("++++++++++++++++ API Response +++++++++++++++++");
          console.log(res.data);
          console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
          console.log(tx.stringify());
          console.log("++++++++++++++++ End Script +++++++++++++++++");
				} catch(ex) {
					console.error("broadcast transaction error %s", ex.errno)
				}
			} else {
				console.error("signing with card failed");
			}
		} else {
			console.log('no reader')
		}
	} catch(ex) {
		console.error("doMeasurements error - %s", ex.message);
	} finally {
		setTimeout(doMeasurements, 5000);
	}
}

setTimeout(doMeasurements, 1000);