const cryptography = require('@liskhq/lisk-cryptography');
const { APIClient } = require('@liskhq/lisk-api-client');
const transactions = require('@liskhq/lisk-transactions');
const { getReader, getActivecardData, signDataUsingActiveCard, rescanActiveCard } = require('../../tangem-smart/nfc-reader');
const RegisterMeasurementTransaction = require('../../transactions/register-measurement.js');

const networkIdentifier = cryptography.getNetworkIdentifier(
    "19074b69c97e6f6b86969bb62d4f15b888898b499777bda56a3a2ee642a7f20a",
    "Lisk",
);

const api = new APIClient(['http://localhost:4000']);

let gSensorState = {
	temperatureUp: true,
	temperature: 16,
	temperatureUp: true,
	humidity: 50
}

const getAccount = async (address) => {
  try {
    let accounts = await api.accounts.get({address})
    if(accounts.data.length>0) { return accounts.data[0] } else return false;
  } catch(ex) {
    return false;
  }
}

const doMeasurements = async () => {
  let goFast = true;
	try {
		console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
		let reader = getReader();
		if(reader) {
      await rescanActiveCard();
      let activeCardData = getActivecardData()
      if(false===activeCardData) {
        console.log("no card in reader");
        return;
      }
      
      if(undefined === activeCardData.WalletPublicKey) {
        console.log("not a valid smart package");
        return;
      }

			let packetPublicKey = activeCardData.WalletPublicKey.toString('hex');
			let packetID = cryptography.getAddressFromPublicKey(activeCardData.WalletPublicKey)

      let packetAccount = await getAccount(packetID);
      goFast = true;
			if(false===packetAccount) {
        console.log("packet with Id %s has not yet been registered", packetID);
        return;
			} else if ( packetAccount.asset.status !== 'ongoing'){
        console.log("packet with Id %s - transport not active (status: %s)", packetID, packetAccount.asset.status);
        return;
      } else {
        // console.log("packet data: %o", packetAccount.asset);
        goFast = false;
      }
			
      // simulate gradual changes in temperature and humidity
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
        timestamp: new Date().getTime() / 1000,
				temperature: Math.round(gSensorState.temperature*100)/100,
				humidity: Math.round(gSensorState.humidity*100)/100
			};

      // create measurement transaction
			let tx = new RegisterMeasurementTransaction({
					networkIdentifier,
					senderPublicKey: packetPublicKey,
					asset: measurement,
					fee: transactions.utils.convertLSKToBeddows('0.01'),
          nonce: packetAccount.nonce
			});
      
      // console.log("got transaction %o", tx)
      // console.log(tx.getBytes().toString('hex'));

      // sign transaction using on-card wallet
    	const transactionWithNetworkIdentifierBytes = Buffer.concat([
				cryptography.hexToBuffer(networkIdentifier),
				tx.getBytes()
			]);
    	
  		// sign hash of data with the card
  		const datatosign = cryptography.hash(transactionWithNetworkIdentifierBytes)
      console.log("got data to sign (%s bytes) %s", datatosign.length, datatosign.toString('hex'))
  		tx.signatures = [await signDataUsingActiveCard(datatosign, false)];

    	if(false!==tx.signatures[0]) {
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
		} else {
			console.log('no active wallet')
		}
	} catch(ex) {
		console.error("doMeasurements error - %s", ex.message);
	} finally {
		setTimeout(doMeasurements, goFast? 1000: 15000);
	}
}

setTimeout(doMeasurements, 1000);