const express = require('express');
const bodyParser = require('body-parser');
const { APIClient } = require('@liskhq/lisk-api-client');
const RegisterPacketTransaction = require('../transactions/register-packet');
const LightAlarmTransaction = require('../transactions/light-alarm');
const StartTransportTransaction = require('../transactions/start-transport');
const FinishTransportTransaction = require('../transactions/finish-transport');
const transactions = require('@liskhq/lisk-transactions');
const cryptography = require('@liskhq/lisk-cryptography');
const { Mnemonic } = require('@liskhq/lisk-passphrase');

const {
  checkReader,
  demophrases,
  renderSmart,
  handlerRegisterSmartPackage,
  handlerSmartStartTransport,
  handlerSmartAddMeasurement,
  handlerSmartFinishTransport,
  handlerSmartEraseWallet } = require('./handlers');

// Constants
const API_BASEURL = 'http://localhost:4000';
const PORT = 3000;

// Initialize
const app = express();
const api = new APIClient([API_BASEURL]);

app.locals.formdata = {
  passphrasesender: demophrases[0],
  passphraserecipient: demophrases[2],
  passphrasecarrier: demophrases[4],
  postage: 15,
  security: 300,
  minTrust: 0,
  endstatus: 'success'
}

app.locals.payload = {
    tx: null,
    res: null,
};

app.locals.message = {
    iserror: false,
    message: "",
    returnpage: false // link to page that should be opened when user clicks back button
};

// Configure Express
app.set('view engine', 'pug');
app.use(express.static('public'));

// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* Routes */
app.get('/', (req, res) => {
    res.render('index');
});

/**
 * Request all accounts
 */
app.get('/accounts', async(req, res) => {
    let offset = 0;
    let accounts = [];
    const accountsArray = [];

    do {
        const retrievedAccounts = await api.accounts.get({ limit: 100, offset });
        accounts = retrievedAccounts.data;
        accountsArray.push(...accounts);

        if (accounts.length === 100) {
            offset += 100;
        }
    } while (accounts.length === 100);

    res.render('accounts', { accounts: accountsArray });
});

app.get('/packet-accounts', async(req, res) => {
    let offset = 0;
    let accounts = [];
    let accountsArray = [];

    do {
        const retrievedAccounts = await api.accounts.get({ limit: 100, offset });
        accounts = retrievedAccounts.data;
        accountsArray.push(...accounts);

        if (accounts.length === 100) {
            offset += 100;
        }
    } while (accounts.length === 100);

    let assetAccounts = [];
    for (let i = 0; i < accountsArray.length; i++) {
        let accountAsset = accountsArray[i].asset;
        if (accountAsset && Object.keys(accountAsset).length > 0){
            assetAccounts.push(accountsArray[i]);
        }
    }

    res.render('packet-accounts', { accounts: assetAccounts });
});

/**
 * Page for displaying responses
 */
app.get('/message', async(req, res) => {
    res.render('message', res.app.locals.message );
});

/**
 * Page for interaction with smart package
 */
app.get('/smart', renderSmart(app, api));

/**
 * Handlers for interaction with smart package
 */
app.post('/post-smart-registerpackage', handlerRegisterSmartPackage(app, api));
app.post('/post-smart-starttransport', handlerSmartStartTransport(app, api))
app.post('/post-smart-addmeasurement', handlerSmartAddMeasurement(app, api));
app.post('/post-smart-finishtransport', handlerSmartFinishTransport(app, api))
app.post('/post-smart-erasewallet', handlerSmartEraseWallet(app, api));

app.listen(PORT, () => console.info(`Explorer app listening on port ${PORT}!`));

setTimeout(checkReader, 1000);
