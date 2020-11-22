const cryptography = require('@liskhq/lisk-cryptography');
const { APIClient } = require('@liskhq/lisk-api-client');
const transactions = require('@liskhq/lisk-transactions');
const { getReader, getActivecardData, signDataUsingActiveCard } = require('./nfc-reader');
const RegisterPacketTransaction = require('../../transactions/register-packet.js');
const LightAlarmTransaction = require('../../transactions/light-alarm.js');
const RegisterMeasurementTransaction = require('../../transactions/register-measurement.js');
const { getPackageStatus } = require('./get-package-status.js');

const networkIdentifier = cryptography.getNetworkIdentifier(
	"23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d",
	"Lisk",
);

// const gTestAccounts = {
// 	"recipient": {
//     "name": "delegate_100",
//     "address": "11012441063093501636L",
//     "passphrase": "dream theory eternal recall valid clever mind sell doctor empower bread cage",
//     "encryptedPassphrase": "iterations=10&cipherText=b009292f88ea0f9f5b5aec47a6168b328989a37e7567aea697b8011b3d7fb63a07d7d8553c1a52740fd14453d84f560fda384bf1c105b5c274720d7cb6f3dbf6a9ed9f967cdc7e57f274083c&iv=ec7e5ebe2c226fcd8209fc06&salt=0478b7883713866370ae927af7525ed2&tag=29aa766741bf5b4bbcfeaf3cd33ad237&version=1",
//     "publicKey": "d8685de16147583d1b9f2e06eb43c6af9ba03844df30e20f3cda0b681c14fb05"
//   },
//   "sender": {
//     "address": "11237980039345381032L",
//     "passphrase": "creek own stem final gate scrub live shallow stage host concert they"
//   }
// }


// Enter here the IP of the node you want to reach for API requests
// Check the IP by running `ifconfig` inside your local terminal
const api = new APIClient(['http://localhost:4000']);

// Check config file or curl localhost:4000/api/node/constants to verify your epoc time (OK when using /transport/node/index.js)
const dateToLiskEpochTimestamp = date => (
    Math.floor(new Date(date).getTime() / 1000) - Math.floor(new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0)).getTime() / 1000)
);

const doFundPackage = async (packetID, networkIdentifier) => {
	let tx = new transactions.TransferTransaction({
			asset: {
					amount: '1',
					recipientId: packetID
			},
			networkIdentifier: networkIdentifier,
	});

	tx.sign('creek own stem final gate scrub live shallow stage host concert they'); // Genesis account with address: 11237980039345381032L
}

// const doRegisterPackage = async (packetId) => {
// 	try {
// 		console.log("registering package")
//
// 		const postage = "100";
// 		const security = "10";
// 		const minTrust = 0;
// 		const recipientId = gTestAccounts.recipient.address;
// 		const passphrase = gTestAccounts.sender.passphrase;
//
// 		const registerPackageTransaction = new RegisterPacketTransaction({
// 				asset: {
// 						security: transactions.utils.convertLSKToBeddows(security),
// 						minTrust,
// 						postage: transactions.utils.convertLSKToBeddows(postage),
// 						packetId,
// 						recipientId,
// 				},
// 				networkIdentifier: networkIdentifier,
// 				timestamp: dateToLiskEpochTimestamp(new Date()),
// 		});
//
// 		console.log("registering package - sign")
// 		registerPackageTransaction.sign(passphrase);
//
// 		api.transactions.broadcast(registerPackageTransaction.toJSON()).then(response => {
// 				console.log("++++++++++++++++ API Response +++++++++++++++++");
// 				console.log(response.data);
// 				console.log("++++++++++++++++ Transaction Payload +++++++++++++++++");
// 				console.log(registerPackageTransaction.stringify());
// 				console.log("++++++++++++++++ End Script +++++++++++++++++");
// 		}).catch(err => {
// 				console.log("++++++++++++++++ API Error Response +++++++++++++++++");
// 				console.log(JSON.stringify(err));
// 				console.log(JSON.stringify(err.errors, null, 2));
// 		});
// 		console.log("registering package - done")
// 	} catch(ex) {
// 		console.log("doRegisterPackage - error %s", ex.message);
// 	}
// }

const sendTransaction = async (tx, networkIdentifier, senderPublicKey) => {
		
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
		console.log("sending transaction")
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

}

let gSensorState = {
	temperatureUp: true,
	temperature: 16,
	temperatureUp: true,
	humidity: 50
}

const doMeasurements = async () => {
	try {
		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
		let reader = getReader();
		if(false!==reader) {
			let activeCardData = getActivecardData()
			let packetPublicKey = activeCardData.WalletPublicKey.toString('hex');
			let packetID = cryptography.getAddressFromPublicKey(activeCardData.WalletPublicKey)
			
			let packages = await getPackageStatus(api);
			console.log("*****************************************************");
			if(packages.length===0) {
				console.log("register package with id %s", packetID)
				// await doFundPackage(packetID, networkIdentifier);
				// await doRegisterPackage(packetID)
				// console.log("register package with id %s done", packetID)
			}
			
			// https://lisk.io/documentation/lisk-sdk/references/lisk-elements/cryptography.html#_getaddressfrompublickey
			// console.log("sensor hardware wallet address is %s", packetID);
			// let tx = new LightAlarmTransaction({
      //     timestamp: dateToLiskEpochTimestamp(new Date()),
      //     networkIdentifier,
			// 		senderPublicKey: packetPublicKey
      // });
			//
			// sendTransaction(tx, networkIdentifier, packetPublicKey)
			
			gSensorState.temperature += (gSensorState.temperatureUp ? 1 : -1) * Math.random();
			if(gSensorState.temperature>30) {
				gSensorState.temperatureUp = false
			} else if(gSensorState.temperature<5) {
				gSensorState.temperatureUp = true
			}
			
			gSensorState.humidity += (gSensorState.humidityUp ? 1 : -1) * Math.random();
			if(gSensorState.humidity>70) {
				gSensorState.humidityUp = false
			} else if(gSensorState.humidity<40) {
				gSensorState.humidityUp = true
			}

			let measurement = {
				temperature: Math.round(gSensorState.temperature*100)/100,
				humidity: Math.round(gSensorState.humidity*100)/100
			};
			let tx2 = new RegisterMeasurementTransaction({
					timestamp: dateToLiskEpochTimestamp(new Date()),
					networkIdentifier,
					senderPublicKey: packetPublicKey,
					asset: measurement
			});
			sendTransaction(tx2, networkIdentifier, packetPublicKey)
			
			
		} else {
			console.log('no reader')
		}
	} catch(ex) {
		console.error("doMeasurements error - %s", ex.message);
	} finally {
		setTimeout(doMeasurements, 15000);
	}
}

setTimeout(doMeasurements, 1000);