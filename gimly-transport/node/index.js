const { Application, genesisBlockDevnet, configDevnet } = require('lisk-sdk');
const RegisterMeasurementTransaction = require('../transactions/register-measurement');
const RegisterPacketTransaction = require('../transactions/register-packet');
const StartTransportTransaction = require('../transactions/start-transport');
const FinishTransportTransaction = require('../transactions/finish-transport');
const LightAlarmTransaction = require('../transactions/light-alarm');

configDevnet.label = 'lisk-transport';
configDevnet.modules.http_api.access.public = true;
//configDevnet.components.logger.consoleLogLevel = 'debug';

const app = new Application(genesisBlockDevnet, configDevnet);
app.registerTransaction(RegisterPacketTransaction);
app.registerTransaction(StartTransportTransaction);
app.registerTransaction(FinishTransportTransaction);
app.registerTransaction(LightAlarmTransaction);
app.registerTransaction(RegisterMeasurementTransaction);

app
    .run()
    .then(() => app.logger.info('App started...'))
    .catch(error => {
        console.error('Faced error in application', error);
        process.exit(0);
    });
