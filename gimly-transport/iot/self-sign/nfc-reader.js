const { readCard, signData } = require('./tangem/tangemcard');
const { NFC } = require('nfc-pcsc');

let nfc = new NFC(); // optionally you can pass logger

var gActiveReader = false;
var gActivecardData = false; // no card available

exports.getReader = () => gActiveReader;

exports.getActivecardData = () => gActivecardData;

exports.signDataUsingActiveCard = async ( data, isRawData=false  ) => {
	try {
		if(gActiveReader!==false && gActivecardData!==false) {
			let result = await signData(gActiveReader, data, isRawData, gActivecardData.CardId);
			if(false!==result && "Signature" in result) {
				return result.Signature
			} else {
				console.log("nfc-reader.signDataUsingActiveCard - unable to sign data")
				return false;
			}
		} else {
			return false;
		}
	} catch(ex) {
		console.log("nfc-reader.signDataUsingActiveCard - error %s", ex.message)
	}
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

nfc.on('reader', async reader => {
	
	reader.autoProcessing = false;
  
	console.log(`${reader.reader.name}  device attached`);
	console.log(`device: `, reader.reader);
	
	reader.on('card', async card => {
    try {
			gActiveReader = reader;
			let data = await readCard(reader);
			
			console.log(`${reader.reader.name}  card found attached`);
			console.log(`device: `, reader.reader);

			// console.log("got card data %o", data)
			
			// decode part of card data to check if card has been properly set up
			
			console.log("got wallet public key %s", data.WalletPublicKey.toString("hex"))
			
			gActivecardData = data;
			
      showResultOnReader(reader, ledSIGNALSTATE3, dataSIGNALSTATE3)
  	} catch (err) {
  		console.error(`error when reading data`, err);
      showResultOnReader(reader, ledSIGNALSTATE3, dataSIGNALSTATE3)
  	}
	});

	reader.on('card.off', card => {
		console.log(`${reader.reader.name}  card removed`, card);
		gActiveReader = false;
		gActivecardData = false;
	});

	reader.on('error', err => {
		console.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		console.log(`${reader.reader.name}  device removed`);

		gActiveReader = false;
		gActivecardData = false;
	});

});

nfc.on('error', err => {
	console.log('an error occurred', err);
});

const scanTag = (reader, tagid) => {
  console.log("scanTag")
}

// P2: LED State Control (1 byte = 8 bits)
// format:
/*
 +-----+----------------------------------+-------------------------------------+
 | Bit |               Item               |             Description             |
 +-----+----------------------------------+-------------------------------------+
 |   0 | Final Red LED State              | 1 = On; 0 = Off                     |
 |   1 | Final Green LED State            | 1 = On; 0 = Off                     |
 |   2 | Red LED State Mask               | 1 = Update the State; 0 = No change |
 |   3 | Green LED State Mask             | 1 = Update the State; 0 = No change |
 |   4 | Initial Red LED Blinking State   | 1 = On; 0 = Off                     |
 |   5 | Initial Green LED Blinking State | 1 = On; 0 = Off                     |
 |   6 | Red LED Blinking Mask            | 1 = Blink; 0 = Not Blink            |
 |   7 | Green LED Blinking Mask          | 1 = Blink; 0 = Not Blink            |
 +-----+----------------------------------+-------------------------------------+
 */

//const led = 0b00001111;
//const led = 0x50;

// Data In: Blinking Duration Control (4 bytes)
// Byte 0: T1 Duration Initial Blinking State (Unit = 100 ms)
// Byte 1: T2 Duration Toggle Blinking State (Unit = 100 ms)
// Byte 2: Number of repetition
// Byte 3: Link to Buzzer
// - 00: The buzzer will not turn on
// - 01: The buzzer will turn on during the T1 Duration
// - 02: The buzzer will turn on during the T2 Duration
// - 03: The buzzer will turn on during the T1 and T2 Duration

// 5 x beep + red = error -> no connection to backend
// const ledError = 0x5C;
// const dataError = [ 0x01, 0x06, 0x05, 0x01];

// 1 beep + green -> scan ok
const ledOK = 0x2A;
const dataOK = [ 0x02, 0x06, 0x01, 0x01];

// 2 x beep + green
const ledSIGNALSTATE1 = 0x2A;
const dataSIGNALSTATE1 = [ 0x02, 0x02, 0x02, 0x01];

// 2 x beep + red
const ledSIGNALSTATE2 = 0x15;
const dataSIGNALSTATE2 = [ 0x02, 0x02, 0x02, 0x01];

// 3 x beep + red = other errors
const ledSIGNALSTATE3 = 0x15;
const dataSIGNALSTATE3 = [ 0x02, 0x02, 0x03, 0x01];

const showResultOnReader = async (reader, led, data) => {
  // if (settings.silent&&settings.silent===true) {
  //   return;
  // }
  // disable buzzer by default
	// reader.name.toLowerCase().indexOf('acr1252') !== -1
  // if(reader.name.toLowerCase().indexOf('acr122') !== -1) {
  //   	if(reader.reader) {
  //   		try {
  //   			//let result = await reader.connect(CONNECT_MODE_DIRECT);
  //   			await reader.reader.led(led,data);
  //   			//await reader.disconnect();
  //   		} catch (err) {
  //   			console.log(`initial sequence error`, err); // , reader,
  //   		}
  //   	} else {
  //   		console.log('ignore reader %s', reader.reader.name);
  //   	}
  // } else {
  //   // console.warn('unknown reader - I say "ERROR!');
  // }
  
}
