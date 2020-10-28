import { readCard } from './tangem/tangemcard';

import { NFC } from 'nfc-pcsc';

let nfc = new NFC(); // optionally you can pass logger

const initReader = ( onCardPresent, onCardRemoved) => {
	if(undefined===nfc) {
		nfc = new NFC(); // optionally you can pass logger
	}
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

nfc.on('reader', async reader => {
	
	reader.autoProcessing = false;
  
	console.log(`${reader.reader.name}  device attached`);

  const readTag = async (reader) => {
    // tlvTagName is written on position #30 - #34 on the card
    // todo: do this properly through NDEF format message decoding
    try {
      const carddata = await reader.read(7, 8, 16);
      return carddata.slice(2,7).toString("utf8");
    } catch(ex) {
      console.error('readTag error %s', ex.message);
    }
  }

  // NB: NOT TESTED YET!
  // const writeTag = async (reader, tlvTagName) => {
  //   // tlvTagName is written on position #30 - #34 on the card
  //   // todo: do this properly through NDEF format message writing
  //   if(tlvTagName.length!=5) {
  //     console.warn("invalid tlvTagName");
  //     return;
  //   }
  //
  //   // create 2 x 4 sized buffer since only
  //   // complete blocks can be written to the card
  //   var writebuffer = Buffer.alloc(8);
  //   var tagbuffer = Buffer.from(tlvTagName, 'utf8');
  //   writebuffer[0]=0x65;
  //   writebuffer[1]=0x6e;
  //   tagbuffer.copy(writebuffer, 2); // copy tlvTagName into data block at position 2
  //   writebuffer[7]=0xfe;
  //
  //   console.log("new tlvTagName", writebuffer)
  //
  //   return true;
  //
  //   // const cardDataShort = await reader.write(7, 8);
  //   // return cardDataShort.slice(2).toString("utf8");
  // }
	
	reader.on('card', async card => {
    // console.log(`Found card: ${card.uid}`)
    
    try {
			await readCard(reader);
			
      // let tlvTagName = await readTag(reader);
      // console.log("found tlvTagName", JSON.stringify(tlvTagName));
      showResultOnReader(reader, ledSIGNALSTATE3, dataSIGNALSTATE3)
  	} catch (err) {
  		console.error(`error when reading data`, err);
      showResultOnReader(reader, ledSIGNALSTATE3, dataSIGNALSTATE3)
  	}
	});

	// reader.on('card.off', card => {
	// 	console.log(`${reader.reader.name}  card removed`, card);
	// });

	reader.on('error', err => {
		console.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		console.log(`${reader.reader.name}  device removed`);
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
  if(reader.name.toLowerCase().indexOf('acr122') !== -1) {
    	if(reader.reader) {
    		try {
    			//let result = await reader.connect(CONNECT_MODE_DIRECT);
    			await reader.reader.led(led,data);
    			//await reader.disconnect();
    		} catch (err) {
    			console.log(`initial sequence error`, err); // , reader,
    		}
    	} else {
    		console.log('ignore reader %s', reader.reader.name);
    	}
  } else {
    // console.warn('unknown reader - I say "ERROR!');
  }
  
}
