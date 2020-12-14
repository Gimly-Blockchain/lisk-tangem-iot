const cryptography = require('@liskhq/lisk-cryptography');
const transactions = require('@liskhq/lisk-transactions');

const { getReader, getActivecardData, signDataUsingActiveCard, createWalletUsingActiveCard, purgeWalletUsingActiveCard } = require('../tangem-smart/nfc-reader');

const RegisterPacketTransaction = require('../transactions/register-packet');
const StartTransportTransaction = require('../transactions/start-transport');
const FinishTransportTransaction = require('../transactions/finish-transport');
const RegisterMeasurementTransaction = require('../transactions/register-measurement');

const { doErrorMessage, doInfoMessage, fundAddress, getAccountDescriptionByPassphrase, getAddressForPassphrase,
        getMeasurementData, getNonceForAddress, getAccount, networkIdentifier, sleep } = require('./functions');


const demophrases = [
  'shoot mask possible wife melody always image denial scheme oil program patient',
  'peasant bring ordinary brown ski similar million enable twice north enjoy people',
  'snack wrap harvest woman hazard tuna drop silk legend actress trigger drill',
  'almost shed define vocal mobile alpha gesture still enact easily pitch biology',
  'slice stumble mansion duty oak polar bless slab merge never close teach',
  'imitate slab hurry door core inside olive morning volume exercise general lady'
]

var haveCard = false;
var currentPacketId = false;
var currentPacketPublicKey = false;

checkReader = () => {
  try {
    let reader = getReader();
    if(false!==reader) {
      let activeCardData = getActivecardData()
      haveCard = true;
      currentPacketPublicKey = false;
      currentPacketId = false;
      if(activeCardData && "WalletPublicKey" in activeCardData) {
        currentPacketPublicKey = activeCardData.WalletPublicKey.toString('hex');
        currentPacketId = cryptography.getAddressFromPublicKey(activeCardData.WalletPublicKey)
      }
    } else {
      haveCard = false;
    };
    
    // console.log("hc %s / cpid %s", haveCard, currentPacketId);
  } catch(ex) {
    console.error("app.checkReader - error ", ex.message)
  } finally {
    setTimeout(checkReader, 1000);
  }
}

const renderSmart = (app, api) => async (req, res) => {
  const demoaccounts = await Promise.all(demophrases.map((phrase, index)=>getAccountDescriptionByPassphrase(api, phrase, index)));
  
  let currentPacket = false;
  let currentRecipientPassphrase = false;
  if(currentPacketId!==false) {
    currentPacket = await getAccount(api, currentPacketId);
    if(currentPacket) {
      let recipientdata = demoaccounts.find(account=>{return account.address===currentPacket.asset.recipient});
      if(recipientdata) { currentRecipientPassphrase = recipientdata.passphrase }
    }
  }
  
  let temperaturedata = await getMeasurementData(api, 'temperature', currentPacketId);

  console.log("current recipient passphrase: %s", currentRecipientPassphrase);
  console.log("current packetId: %o", currentPacketId);
  console.log("current packet: %o", currentPacket);
  
  res.render('smart', {
    haveCard,
    currentPacketId,
    currentPacket,
    currentRecipientPassphrase,
    demoaccounts,
    temperaturedata: JSON.stringify(temperaturedata),
    locals: app.locals });
}

const handlerSmartStartTransport = (app, api) => async function (req, res) {
  // save current values
  app.locals.formdata.passphrasecarrier = req.body.passphrasecarrier;
  
  if(req.body.submit==='Fund Carrier with 1500 LSK') {
    // fund button pressed
    let participantAddress = getAddressForPassphrase(app.locals.formdata.passphrasecarrier);
    let amount = "1500"
    let success = await fundAddress(api, participantAddress, "1500");
    if(success) {
      doInfoMessage(res, `Fund recipient ${participantAddress} with ${amount} LSK Success`)
    } else {
      doErrorMessage(res, `Fund recipient ${participantAddress} with ${amount} LSK failed`)
    }
  } else {
    try {
      // start transport here
      let carrieraddress = getAddressForPassphrase(app.locals.formdata.passphrasecarrier);
      const startTransportTransaction = new StartTransportTransaction({
          asset: {
              packetId: currentPacketId,
          },
          fee: '1160000',
          nonce: await getNonceForAddress(api, carrieraddress),
      });

      startTransportTransaction.sign(networkIdentifier, app.locals.formdata.passphrasecarrier);

      let success = await api.transactions.broadcast(startTransportTransaction.toJSON());
      if(false===success) {
        res.app.locals.message = {
          iserror :!success,
          message: `Start transport` + (success ? "Success": "Failed"),
          returnpage: 'smart'
        };
        console.log(app.locals.message.message);
        res.redirect('/message');
      }
      
      maxwait = 30; // max waittime in seconds
      success = false;
      do {
        let packetaccount = await getAccount(api, currentPacketId);
        success = true==='status' in packetaccount.asset && packetaccount.asset.status!=='';
        if(!success) {
          await sleep(1000);
          maxwait--;
        } else {
          break;
        }
      } while(maxwait>0);

      res.app.locals.message = {
        iserror :!success,
        message: `Start transport` + (success ? "Success": "Failed"),
        returnpage: 'smart'
      };
      console.log(app.locals.message.message);
      res.redirect('/message');
    } catch(ex) {
      res.app.locals.message = {
        iserror :false,
        message: `Start transport failed ` + ex.message,
        returnpage: 'smart'
      };

      res.redirect('/message');
    }
  }
}

const handlerSmartEraseWallet = (app, api) => async (req, res) => {
  if(haveCard && currentPacketId !== false) {
    let account = getAccount(api, currentPacketId);
    if(false!==account&&Number(account.balance)>0) {
      doErrorMessage(res, 'This wallet still has funds. Unable to erase wallet!');
    }
    
    console.log("purge wallet from tangem card")
    let result = await purgeWalletUsingActiveCard()
    doInfoMessage(res, 'wallet purged!');
  }  else {
    doErrorMessage(res, 'no card or card already purged!');
  }
}

const handlerSmartAddMeasurement = (app, api) => async (req, res) => {
  if(haveCard && currentPacketId !== false) {
    let randomtemperature = 15 + Math.random()*20;
    let randomhumidity = 50 + Math.random()*50;
    
    let measurement = {
      timestamp: new Date().getTime() / 1000,
      temperature: Math.round(randomtemperature*100)/100,
      humidity: Math.round(randomhumidity*100)/100
    };
    
    console.log("measumerent %o", measurement);
    
    let packetAccount = await getAccount(api, currentPacketId);
    console.log(packetAccount);
    let tx = new RegisterMeasurementTransaction({
        networkIdentifier,
        senderPublicKey: currentPacketPublicKey,
        asset: measurement,
        fee: transactions.utils.convertLSKToBeddows('0.1'),
        nonce: packetAccount.nonce
    });
    
    // sign transaction using on-card wallet
    const transactionWithNetworkIdentifierBytes = Buffer.concat([
      cryptography.hexToBuffer(networkIdentifier),
      tx.getBytes()
    ]);
    
    // sign hash of data with the card
    const datatosign = cryptography.hash(transactionWithNetworkIdentifierBytes)
    tx.signatures = [await signDataUsingActiveCard(datatosign, false)];

    if(false!==tx.signatures[0]) {
      console.log("sending measurement")

      tx._id = transactions.utils.getId(tx.getBytes());
      let measurementresult = await api.transactions.broadcast(tx.toJSON());

      doInfoMessage(res, 'measurement registered');
    } else {
      doErrorMessage(res, 'unable to sign measurement');
    }
  } else {
    doErrorMessage(res, 'no valid card!');
  }
}

const handlerSmartFinishTransport = (app, api) => async (req, res) => {
  // save current values
  app.locals.formdata.endstatus = req.body.endstatus;
  let currentPacket = await getAccount(api, currentPacketId);
  
  if(req.body.submit==='Fund recipient with 100 LSK') {
    // fund button pressed
    let participantAddress = currentPacket.asset.recipient;
    let success = await fundAddress(api, participantAddress, "100");
    if(success) {
      doInfoMessage(res, `Fund recipient ${participantAddress} with 100 LSK Success`)
    } else {
      doErrorMessage(res, `Fund recipient ${participantAddress} with 100 LSK failed`)
    }
  } else {
    try {
      // find recipient passphrase for signing
      const demoaccounts = await Promise.all(demophrases.map((phrase, index)=>getAccountDescriptionByPassphrase(api, phrase, index)));
      let recipientdata = demoaccounts.find(account=>{ return account.address===currentPacket.asset.recipient });
      
      console.log("recipientdata %o", recipientdata);

      const finishTransportTransaction = new FinishTransportTransaction({
          asset: {
              packetId: currentPacketId,
              status: app.locals.formdata.endstatus
          },
          fee: transactions.utils.convertLSKToBeddows('0.1'),
          nonce: await getNonceForAddress(api, currentPacket.asset.recipient),
      });

      console.log("%s -> %s", recipientdata.passphrase, getAddressForPassphrase(recipientdata.passphrase));
      finishTransportTransaction.sign(networkIdentifier, recipientdata.passphrase);
      console.log("account %s got transaction %o", recipientdata.address, finishTransportTransaction);
      
      let success = await api.transactions.broadcast(finishTransportTransaction.toJSON());
      
      maxwait = 30; // max waittime in seconds
      success = false;
      do {
        let packetaccount = await getAccount(api, currentPacketId);
        
        console.log(packetaccount)
        success = true==='status' in packetaccount.asset && packetaccount.asset.status!=='';
        if(!success) {
          await sleep(1000);
          maxwait--;
        } else {
          break;
        }
      } while(maxwait>0);

      if(success) {
        doInfoMessage(res, `Finish transport of package ${currentPacketId} success`)
      } else {
        doErrorMessage(res, `Finish transport of package ${currentPacketId} failed`)
      }
    } catch(ex) {
      doErrorMessage(res, `Finish transport failed ` + ex.message)
    }
  }
}

const handlerRegisterSmartPackage = (app, api) => async (req, res) => {
  // save current values
  app.locals.formdata.passphrasesender = req.body.passphrasesender;
  app.locals.formdata.passphraserecipient = req.body.passphraserecipient;
  app.locals.formdata.postage = req.body.postage;
  app.locals.formdata.security = req.body.security;
  app.locals.formdata.minTrust = req.body.minTrust;
  
  if(req.body.submit==='Fund Sender with 100 LSK') {
    // fund button pressed
    let participantAddress = getAddressForPassphrase(app.locals.formdata.passphrasesender);
    let success = await fundAddress(api, participantAddress, "100");
    if(success) {
      doInfoMessage(res, `Fund sender ${participantAddress} with 100 LSK success`)
    } else {
      doErrorMessage(res, `Fund sender ${participantAddress} with 100 LSK failed`);
    }
  } else if(req.body.submit==='Fund carrier with 1500 LSK') {
    // fund button pressed
    let participantAddress = getAddressForPassphrase(app.locals.formdata.passphrasecarrier);
    let success = await fundAddress(api, participantAddress, "100");
    if(success) {
      doInfoMessage(res, `Fund carrier ${participantAddress} with 100 LSK success`)
    } else {
      doErrorMessage(res, `Fund carrier ${participantAddress} with 100 LSK failed`);
    }
  } else {
    try {
      // // step 1 -> make sure that the card has no wallet
      if(haveCard && currentPacketId !== false) {
        doErrorMessage(res, "This card already has an address, finish the transport before using it again");
      }
      
      const passphrasesender = app.locals.formdata.passphrasesender;
      const passphraserecipient = app.locals.formdata.passphraserecipient;
      const postage = app.locals.formdata.postage;
      const security = app.locals.formdata.security;
      const minTrust = app.locals.formdata.minTrust;

      let result1 = await createWalletUsingActiveCard()
      if(false===result1) {
        doErrorMessage(res, "Unable to create wallet on this card");
      }
      
      let maxwait = 15; // max waittime in seconds
      do {
        if(currentPacketId===false) {
          await sleep(1000);
          maxwait--;
        } else {
          break;
        }
      } while(maxwait>0);
      
      console.log("got packetId %s", currentPacketId)
      let result = await fundAddress(api, currentPacketId, "100"); // enough for 1000 measurements @ 0.1 lsk each
      if(false===result) {
        doErrorMessage(res, `Funding failed for ${currentPacketId}, finish the transport before using it again`);
      }
      
      maxwait = 30; // max waittime in seconds
      do {
        let packetaccount = await getAccount(api, currentPacketId);
        if(false===packetaccount) {
          await sleep(1000);
          maxwait--;
        } else {
          break;
        }
      } while(maxwait>0);
      
      if(false===result) {
        doErrorMessage(res, "Timeout while waiting for completion of fund transaction");
      }
      
      try {
        console.log("got senderpassphrase %s", passphrasesender)
        let senderAddress = getAddressForPassphrase(passphrasesender);
        const registerPackageTransaction = new RegisterPacketTransaction({
            asset: {
                security: transactions.utils.convertLSKToBeddows(security),
                minTrust: Number(minTrust),
                postage: transactions.utils.convertLSKToBeddows(postage),
                packetId: currentPacketId,
                recipientId: getAddressForPassphrase(passphraserecipient),
            },
            fee: transactions.utils.convertLSKToBeddows('0.1'),
            nonce: await getNonceForAddress(api, senderAddress)
        });
        
        console.log("got transaction %o", registerPackageTransaction)
        
        registerPackageTransaction.sign(networkIdentifier,passphrasesender);
        
        let registerresult = await api.transactions.broadcast(registerPackageTransaction.toJSON());
        doInfoMessage(res, 'package registration complete');
      } catch(ex) {
        doErrorMessage(res, "Packet registration failed: " + JSON.stringify(ex.message, null, 2));
      }
    } catch(ex) {
      doErrorMessage(res, "Packet registration failed: " + JSON.stringify(ex.message, null, 2));
    }
  }
}

module.exports = {
  checkReader,
  demophrases,
  renderSmart,
  handlerRegisterSmartPackage,
  handlerSmartStartTransport,
  handlerSmartAddMeasurement,
  handlerSmartFinishTransport,
  handlerSmartEraseWallet
}