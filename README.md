## Introduction
This made-for-blockchain IoT supply chain PoC is funded through the Lisk builders program. It aims to combine Tangem made-for-blockchain NFC chips and the Lisk SDK supply chain solution to connect physical goods to digital blockchains in a supplychain solution.

### Use case
The solution will track temperature in a shipping container that holds two packages A and B carrying mfb NFC chips, and that have different temperature requirements. Package A can be stored at max 6°C and Package B at max 4°C. 

The shipping container holds a secure IoT temperature sensor, that contains a mfb NFC chip itself. This chip is used for signing any transactions on behalve of the IoT sensor, and possibly also for storing temperature data.

During the shipping, the temperature at some point rises to 5°C. When package A and B are scanned upon arrival, package A should get a green flag (temp stayed below 6°C) while package B should get a red flag (temperature rose above 5°C).

## Resources
* Project introduction: https://www.gimly.io/blog/physical-digital-nexus.  
* Tangem's made-for-blockchain NFC tech: https://www.gimly.io/tangem.  
* Lisk SDK Supply Chain: https://github.com/LiskHQ/lisk-sdk-examples/tree/development/transport
* Tangem android SDK for implementing tangem commands and interactions: https://github.com/Gimly-Blockchain/tangem-sdk-android.   
* Tangem core JVM library for implementing Tangem commands and interaction on JVM, other than android: https://github.com/Gimly-Blockchain/tangem-sdk-android/tree/master/tangem-core.   

## Plan
1. MfB NFC chips: Connect tangem dev. cards to Lisk
1.1 Personalise card; generate new ED25519 pub/priv key pair. 
1.2 Generate lisk account using new pub key. --> how?

2. Implement Tangem JVM core commands and interactions in IoT application and client / UI application.

3. Ensure that the signing of the transactions is not done by the package account with passphrase, but instead is done by the MfB NFC chip. Note: the private key from this chip cannot be extracted, so the pub/priv pair connot simply be used to generate new package account.

4. All temperature data must be stored securely, and anchored in blockchain. When scanning the boxes at exit, client app must validate temperature (stored in cloud, or on IoT sensor's NFC chip) data in blockchain, and check the max temperatures for each box against this temperature data.


