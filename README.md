## Introduction
This made-for-blockchain IoT supply chain PoC is funded through the Lisk builders program. It aims to combine Tangem made-for-blockchain NFC chips and the Lisk SDK supply chain solution to connect physical goods to digital blockchains in a supplychain solution.

### Use case
The solution will track temperature in a shipping container that holds two packages A and B carrying mfb NFC chips, and that have different temperature requirements. Package A can be stored at max 6°C and Package B at max 4°C. 

The shipping container holds a secure IoT temperature sensor, that contains a mfb NFC chip itself. This chip is used for signing any transactions on behalve of the IoT sensor, and possibly also for storing temperature data.

During the shipping, the temperature at some point rises to 5°C. When package A and B are scanned upon arrival, package A should get a green flag (temp stayed below 6°C) while package B should get a red flag (temperature rose above 5°C).

## Resources
* Project introduction: https://www.gimly.io/blog/physical-digital-nexus.  
* Tangem's made-for-blockchain NFC tech: https://www.gimly.io/tangem.
* Tangem Cordova SDK: https://github.com/Gimly-Blockchain/tangem-sdk-cordova
* Tangem android SDK for implementing tangem commands and interactions: https://github.com/Gimly-Blockchain/tangem-sdk-android.   
* Tangem core JVM library for implementing Tangem commands and interaction on JVM, other than android: https://github.com/Gimly-Blockchain/tangem-sdk-android/tree/master/tangem-core.   
* Lisk SDK setup: https://github.com/LiskHQ/lisk-sdk
* Lisk SDK Supply Chain example: https://github.com/LiskHQ/lisk-sdk-examples/tree/development/transport


## PoC 1: object and recipient co-sign custom GPS transaction
The project will be divided in several smaller steps
### 1. Signing lisk transactions with tangem card
1. MfB NFC chips: Connect tangem dev. cards to Lisk
1.1 Personalise card; generate new ED25519 pub/priv key pair. 
1.2 Generate lisk account using new pub key.
2. Implement Tangem functionality in Lisk wallet to sign transactions: native android, or webapp to demonstrate functional NFC cards

### 2. Lisk Supplychain App: recipient, package, and shipper must co-sign custom transaction for succesful delivery
* The recipient has a Lisk Supplychain Account with pub/priv key pair, and has downloaded the Lisk Supplychain App. Recipient orders a package through the app. 
* A package carrying a tangem MfB NFC chip, containing its own pub/priv key pair is shipped to recipient.
* The package is delivered by an authorized shipper, that carries a Tangem NFC card as identifying card, with its own pub/priv key pair. 
* Upon delivery of the package, the recipient scans the object NFC with a mobile device running Lisk Supplychain App
* The app requests signatures from the recipient, from the package, and from the shipper to sign a custom transaction
* Three signatures are required to confirm correct receipt of package: from the recipient, from the package NFC chip, and from the shippers NFC card ID.

## PoC 2: Data read/write to NFC included in custom transaction

### 1. Write/read data to NFC
1. Write data: this object may only be received by recipient with pubkey X
2. Upon receipt, mobile device scans NFC, reads data, extracts rightful recipient's pubkey X
3. Mobile application requests recipient to proves ownership of pubkey X through challenge response
4. Multi sig custom transactions with GPS data (PoC 1) is completed.

## PoC 3: run PoC 1 and 2 on IoT device, include temperature data
IoT device with BLE + NFC measures temperature during transport, signs custom transactions logging temperature data
Write the desire 
Upon boarding a package, mobile device scans package's NFC
All temperature data must be stored securely, and anchored in blockchain. When scanning the boxes at exit, client app must validate temperature (stored in cloud, or on IoT sensor's NFC chip) data in blockchain, and check the max temperatures for each box against this temperature data.


