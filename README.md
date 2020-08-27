
[![npm](https://img.shields.io/npm/v/tangem-sdk.svg?style=flat)](https://www.npmjs.com/package/tangem-sdk)

The Tangem card is a self-custodial hardware wallet for blockchain assets. The main functions of Tangem cards are to securely create and store a private key from a blockchain wallet and sign blockchain transactions. The Tangem card does not allow users to import/export, backup/restore private keys, thereby guaranteeing that the wallet is unique and unclonable.

- [Getting Started](#getting-started)
	- [Requirements](#requirements)
	- [Installation](#installation)
		- [Cordova](#cocoapods)
        - [Capacitor](#capacitor)
        - [iOS Notes](#ios-notes)
        - [Android Notes](#android-notes)
- [Usage](#usage)
	- [Scan card](#scan-card)
	- [Sign](#sign)
    - [Wallet](#wallet)
        - [Create Wallet](#create-wallet)
        - [Purge Wallet](#purge-wallet)
    - [Issuer data](#issuer-data)
        - [Write issuer data](#write-issuer-data)
        - [Write issuer extra data](#write-issuer-extra-data)
        - [Read issuer data](#read-issuer-data)
        - [Read issuer extra data](#read-issuer-extra-data)
    - [User data](#user-data)
        - [Write user data](#write-user-data)
        - [Read user data](#read-user-data)
    - [PIN codes](#pin-codes)    

## Getting Started

### Requirements
#### iOS
iOS 11+ (CoreNFC is required), Xcode 11+
SDK can be imported to iOS 11, but it will work only since iOS 13.

#### Android
Android with minimal SDK version of 21 and a device with NFC support

### Installation
#### Cordova

```cordova plugin add tangem-sdk```

#### Capacitor

```npm install tangem-sdk```

```npx cap sync```


Cordova platform should do all the configurations by itself, but if you install this plugin from other compatible platforms do the following steps.
#### iOS notes

1) Configure your app to detect NFC tags. Turn on Near Field Communication Tag Reading under the Capabilities tab for the project’s target (see [Add a capability to a target](https://help.apple.com/xcode/mac/current/#/dev88ff319e7)).

2) Add the [NFCReaderUsageDescription](https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription) key as a string item to the Info.plist file. For the value, enter a string that describes the reason the app needs access to the device’s NFC reader: 
```xml
<key>NFCReaderUsageDescription</key>
<string>Some reason</string>
```

3) In the Info.plist file, add the list of the application identifiers supported in your app to the [ISO7816 Select Identifiers](https://developer.apple.com/documentation/bundleresources/information_property_list/select-identifiers) (AIDs) information property list key. The AIDs of Tangem cards are: `A000000812010208` and `D2760000850101`.

```xml
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
    <array>
        <string>A000000812010208</string>
        <string>D2760000850101</string>
    </array>
```

4) To prevent customers from installing apps on a device that does not support the NFC capability, add the following to the Info.plist code:

```xml
<key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>nfc</string>
    </array>
```

#### Android notes
Add to a project `build.gradle` file:

```gradle
allprojects {
    repositories {
        maven { url "https://jitpack.io" }
    }
}
```

And add Tangem library to the dependencies (in an app or module `build.gradle` file):

```gradle
dependencies {
    implementation "com.github.tangem.tangem-sdk-android:tangem-core:$latestVersion"
    implementation "com.github.tangem.tangem-sdk-android:tangem-sdk:$latestVersion"
}
```
`tangem-core` is a JVM library (without Android dependencies) that provides core functionality of interacting with Tangem cards.
`tangem-sdk` is an Android library that implements NFC interaction between Android devices and Tangem cards and graphical interface for this interaction.

2. Save the file (you can name it anything you wish) with the following tech-list filters in the `<project-root>/res/xml`

```xml
<resources>
   <tech-list>
       <tech>android.nfc.tech.IsoDep</tech>
       <tech>android.nfc.tech.Ndef</tech>
       <tech>android.nfc.tech.NfcV</tech>
   </tech-list>
</resources>
```

3. Add to `AndroidManifest.xml`:
```xml
<activity android:name="MainActivity" android:theme="@style/Theme.AppCompat.Light.DarkActionBar" />

<intent-filter>
    <action android:name=“android.nfc.action.TECH_DISCOVERED” />
</intent-filter>
<meta-data
    android:name=“android.nfc.action.TECH_DISCOVERED”
    android:resource=“@xml/tech_filter” />
```

### Usage
Tangem SDK is a self-sufficient solution that implements a card abstraction model, methods of interaction with the card and interactions with the user via UI.

The easiest way to use the SDK is to call basic methods. The basic method performs one or more operations and, after that, calls completion block with success or error.

Most of functions have the optional `cardId` argument, if it's passed the operation, it can be performed only with the card with the same card ID. If card is wrong, user will be asked to take the right card.
We recommend to set this argument if there is no special need to use any card.

When calling basic methods, there is no need to show the error to the user, since it will be displayed on the NFC popup before it's hidden.

#### Scan card
Method `tangemSdk.scanCard()` is needed to obtain information from the Tangem card. Optionally, if the card contains a wallet (private and public key pair), it proves that the wallet owns a private key that corresponds to a public one.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.scanCard(callback);
```

#### Sign
Method `tangemSdk.sign()` allows you to sign one or multiple hashes. The SIGN command will return a corresponding array of signatures.

**Arguments:**

| Parameter | Description |
| ------------ | ------------ |
| cardId | *(Optional)* If cardId is passed, the sign command will be performed only if the card  |
| hashes | Array of hashes to be signed by card |

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.sign(callback, cid, [
                "44617461207573656420666f722068617368696e67",
                "4461746120666f7220757365642068617368696e67"
            ]);
```

#### Wallet
##### Create Wallet
Method `tangemSdk.createWallet()` will create a new wallet on the card. A key pair `WalletPublicKey` / `WalletPrivateKey` is generated and securely stored in the card.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.createWallet(callback, cid);
```

##### Purge Wallet
Method `tangemSdk.purgeWallet()` deletes all wallet data.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.purgeWallet(callback, cid);
```

#### Issuer data
Card has a special 512-byte memory block to securely store and update information in COS. For example, this mechanism could be employed for enabling off-line validation of the wallet balance and attesting of cards by the issuer (in addition to Tangem’s attestation). The issuer should define the purpose of use, payload, and format of Issuer Data field. Note that Issuer_Data is never changed or parsed by the executable code the Tangem COS.

The issuer has to generate single Issuer Data Key pair `Issuer_Data_PublicKey` / `Issuer_Data_PrivateKey`, same for all issuer’s cards. The private key Issuer_Data_PrivateKey is permanently stored in a secure back-end of the issuer (e.g. HSM). The non-secret public key Issuer_Data_PublicKey is stored both in COS (during personalization) and issuer’s host application that will use it to validate Issuer_Data field.

##### Write issuer data
Method `tangemSdk.writeIssuerData(cardId: cardId,issuerData: sampleData, issuerDataSignature: dataSignature, issuerDataCounter: counter)` writes 512-byte Issuer_Data field to the card.

**Arguments:**

| Parameter | Description |
| ------------ | ------------ |
| cardId | *(Optional)* If cardId is passed, the sign command will be performed only if the card  |
| issuerData | Data to be written to the card |
| issuerDataSignature | Issuer’s signature of issuerData with `Issuer_Data_PrivateKey` |
| issuerDataCounter | An optional counter that protect issuer data against replay attack. When flag Protect_Issuer_Data_Against_Replay set in the card configuration then this value is mandatory and must increase on each execution of `writeIssuerData` command.  |

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.writeIssuerData(callback, cid,
                "issuerData",
                "issuerDataSignature",
                { issuerDataCounter: 1 }
            );
```

##### Write issuer extra data
If 512 bytes are not enough, you can use method `tangemSdk.writeIssuerExtraData(cardId: cardId, issuerData: sampleData,startingSignature: startSignature,finalizingSignature: finalSig,issuerDataCounter: newCounter)` to save up to 40 kylobytes.

| Parameter | Description |
| ------------ | ------------ |
| cardId | *(Optional)* If cardId is passed, the sign command will be performed only if the card  |
| issuerData | Data to be written to the card |
| startingSignature | Issuer’s signature of `SHA256(cardId | Size)` or `SHA256(cardId | Size | issuerDataCounter)` with `Issuer_Data_PrivateKey` |
| finalizingSignature | Issuer’s signature of `SHA256(cardId | issuerData)` or or `SHA256(cardId | issuerData | issuerDataCounter)` with `Issuer_Data_PrivateKey` |
| issuerDataCounter | An optional counter that protect issuer data against replay attack. When flag Protect_Issuer_Data_Against_Replay set in the card configuration then this value is mandatory and must increase on each execution of `writeIssuerData` command.  |

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.writeIssuerExtraData(callback, cid,
                "data",
                "startingSignature",
                "finalizingSignature",
                { issuerDataCounter: 0 }
            );
```

##### Read issuer data
Method `tangemSdk.readIssuerData()` returns 512-byte Issuer_Data field and its issuer’s signature.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.readUserData(callback, cid);
```

##### Read issuer extra data
Method `tangemSdk.readIssuerExtraData()` ruturns Issuer_Extra_Data field.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.readIssuerData(callback, cid);
```

#### User data
##### Write user data
Method `tangemSdk.writeUserData()` write some of User_Data and User_Counter fields.
User_Data is never changed or parsed by the executable code the Tangem COS. The App defines purpose of use, format and it's payload. For example, this field may contain cashed information from blockchain to accelerate preparing new transaction.

| Parameter | Description |
| ------------ | ------------ |
| cardId | *(Optional)* If cardId is passed, the sign command will be performed only if the card  |
| User_Data | User data |
| User_Counter | Counters, that initial values can be set by App and increased on every signing of new transaction (on SIGN command that calculate new signatures). The App defines purpose of use. For example, this fields may contain blockchain nonce value. |

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.writeUserProtectedData(callback, cid,
                "any data", { userProtectedCounter: 0 });
```

##### Read user data
Method `tangemSdk.readUserData()` returns User Data

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.readIssuerData(callback, cid);
```

#### Pin codes
*Access code (PIN1)* restricts access to the whole card. App must submit the correct value of Access code in each command. 
*Passcode (PIN2)* is required to sign a transaction or to perform some other commands entailing a change of the card state.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.changePin1(callback, cid);
//TangemSdk.changePin2(callback, cid);
```
### Card attestation
#### Card verification
This command is a part of Tangem card attestation. In manufacturing, every new Tangem card internally generates a Card Key pair Card Public Key / Card Private Key. The private key is permanently stored in the card memory and is not accessible to external applications via the NFC interface. At the same time, Tangem publishes the list of CID and corresponding Card Public Key values in its card attestation service and/or hands over this list to the Card Issuer.

```js
var cid = "bb03000000000004";
var callback = {
  success: function(result) {
    console.log("result: " + JSON.stringify(result));
  },
  error: function(error) {
    console.log("error: " + JSON.stringify(error));
  }
}

TangemSdk.verify(callback, cid, true);
```
