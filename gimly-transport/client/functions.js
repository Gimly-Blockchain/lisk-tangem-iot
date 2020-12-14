const cryptography = require('@liskhq/lisk-cryptography');
const transactions = require('@liskhq/lisk-transactions');
const accounts = require('./accounts.json');

const networkIdentifier = cryptography.getNetworkIdentifier(
    "19074b69c97e6f6b86969bb62d4f15b888898b499777bda56a3a2ee642a7f20a",
    "Lisk",
);

const RegisterMeasurementTransaction = require('../transactions/register-measurement');

const getAccountDescriptionByPassphrase = async (api, passphrase, index) => {
  const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(passphrase);
  let address = cryptography.getAddressFromPublicKey(keys.publicKey)
  
  let balance='N/A';

  let account = await getAccount(api, address);
  if(account) {
    balance = transactions.utils.convertBeddowsToLSK(account.balance);
  }

  let data = {
    passphrase,
    description: 'Demo account ' + (index + 1) + ' - (' + balance + ' LSK) - ' + address,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    address,
    balance
  }
  
  return data;
}

const getAddressForPassphrase = (passphrase) => {
    const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(passphrase);
    return cryptography.getAddressFromPublicKey(keys.publicKey)
};

const getNonceForAddress = async (api, address) => {
  try {
    let accounts = await api.accounts.get({address})
    if(accounts.data.length>0) { return accounts.data[0].nonce } else return false;
  } catch(ex) {
    return false;
  }
}

const getAccount = async (api, address) => {
  try {
    let accounts = await api.accounts.get({address})
    if(accounts.data.length>0) { return accounts.data[0] } else return false;
  } catch(ex) {
    return false;
  }
}

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); }

const fundAddress = async (api, address, amount) => {
  try {
    const fundTransaction = transactions.transfer({
        amount: transactions.utils.convertLSKToBeddows(amount.toString()),
        recipientId: address,
        passphrase: accounts.genesis.passphrase,
        networkIdentifier,
        fee: transactions.utils.convertLSKToBeddows('0.1'),
        nonce: await getNonceForAddress(api, accounts.genesis.address),
    });
        
    let result = await api.transactions.broadcast(fundTransaction);
    
    return true;
  } catch(ex) {
    console.error('app.fundaddress - error %s', ex.message)
    return false;
  }
}

const getMeasurementData = async (api, field = 'temperature', packetId=false) => {
  let offset = 0;
  let transactions = [];
  let transactionsArray = [];

  do {
      let filter = { type: RegisterMeasurementTransaction.TYPE, limit: 100, offset };
      if(false!==packetId) { filter.senderId = packetId }
      const retrievedtransactions = await api.transactions.get(filter);
      transactions = retrievedtransactions.data;
      transactionsArray.push(...transactions);
      
      if (transactions.length === 100) {
          offset += 100;
      }
  } while (transactions.length === 100);

  // Sort desc
  transactionsArray.sort((a, b) => {
    // sensor data is grouped together per sensor: sort on packet ID first
    if(a.senderId < b.senderId) return -1;

    if(a.senderId > b.senderId) return 1;
    
    // sort on timestamp next
    if (a.asset.timestamp < b.asset.timestamp) return -1;

    if (a.asset.timestamp > b.asset.timestamp) return 1;

    return 0; // if (a.asset.timestamp === b.asset.timestamp)
  });
    
  let measurementdata = {
    datasets: []
  }

  transactionsArray.forEach((tx, idx) => {
    let senderidx = measurementdata.datasets.findIndex(dataset=>dataset.label===tx.senderId);
    if(-1===senderidx) {
      measurementdata.datasets.push({label: tx.senderId, data: [], backgroundColor: 'rgb(255, 99, 132)', pointRadius: '4'});
      senderidx=measurementdata.datasets.length-1;
    }
    
    measurementdata.datasets[senderidx].data.push({x: idx, y:tx.asset.temperature}); // tx.asset.timestamp*1000
  });
  
  return measurementdata;
}

const doErrorMessage = (res, message) => {
  res.app.locals.message = { iserror: true, message, returnpage: 'smart' }
  console.log("error - %s", message);
  res.redirect('/message');
}

const doInfoMessage = (res, message) => {
  res.app.locals.message = { iserror: false, message, returnpage: 'smart' }
  console.log("info - %s", message);
  res.redirect('/message');
}

module.exports = {
  doErrorMessage,
  doInfoMessage,
  fundAddress,
  getMeasurementData,
  getAccountDescriptionByPassphrase,
  getAddressForPassphrase,
  getNonceForAddress,
  getAccount,
  networkIdentifier,
  sleep
}

