## Introduction
This made-for-blockchain IoT supply chain PoC is funded through the Lisk builders program. It aims to combine Tangem made-for-blockchain NFC chips and the Lisk SDK supply chain solution to connect physical goods to digital blockchains in a supplychain solution. The purpose of the pilot is to demonstrate how the Tangem by Gimly NFC chips can function as an HSM capable of securely signing Lisk custom transactions, thereby securely connecting physical objects to lisk transactions.

## Resources
* Project introduction: https://www.gimly.io/blog/physical-digital-nexus.  
* Tangem's made-for-blockchain NFC tech: https://www.gimly.io/tangem.
* Tangem Cordova SDK: https://github.com/Gimly-Blockchain/tangem-sdk-cordova
* Tangem android SDK for implementing tangem commands and interactions: https://github.com/Gimly-Blockchain/tangem-sdk-android.   
* Tangem core JVM library for implementing Tangem commands and interaction on JVM, other than android: https://github.com/Gimly-Blockchain/tangem-sdk-android/tree/master/tangem-core.   
* Lisk SDK setup: https://github.com/LiskHQ/lisk-sdk
* Lisk SDK Supply Chain example: https://github.com/LiskHQ/lisk-sdk-examples/tree/development/transport


## PoC object signs its own custom transaction instead of the Pi
The project will be divided in several smaller steps

### 1. Signing lisk transactions with tangem card
1. MfB NFC chips: Connect tangem dev. cards to Lisk
1.1 Personalise card; generate new ED25519 pub/priv key pair. 
1.2 Generate lisk account using new pub key.
2. Implement Tangem functionality in Lisk wallet to sign transactions: native android, or webapp to demonstrate functional NFC cards

### 2. Allow IoT device to interact with Tangem NFC 
* Uses the https://github.com/pokusew/nfc-pcsc node npm library for reading smart cards using the ACR-ACS1525 reader
* Uses its own (partial) implementation of the tangem protocol to communicate with the smartcard (non-encrypted mode). These are implemented in tangem/tangemcard.js.
* Based on the LightAlarmTransaction application, for now setup for development on laptop (raspberry hardware interface / pin IO commented out) -> Will be re-enabled when moved to raspberry pi
* In index.js, the NFC communication is setup with a call to initReader (implemented in nfc-reader.js)
* This call sets up a global NFC object (using the nfc-pcsc library) that has event handlers for:
  * Reader detected event
  * Card detected event 
  *	Error event
  * Reader removed event
* In the card detected event handler, a readCard function is called that decodes card information from the tangem card.

### Current status of the project
* Tangem by Gimly cards are connected to Lisk blockchain
  * A wallet in the card is created upon personalisation of Tangem card, using ed25519 curve.
* “Readcard” function partially implemented in IoT device

### Next steps: 
* decode card UID from the TLV record that is returned by readcard command
* Implement request wallet public key command in tangem library
* Implement sign transaction command in tangem library
* Create lisk transaction, replace sign transaction (index.js#55) with card based signing
* Test on raspberry pi
