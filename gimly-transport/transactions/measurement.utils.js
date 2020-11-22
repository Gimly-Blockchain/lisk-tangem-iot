const { TransactionError } = require('@liskhq/lisk-transactions');

module.exports = {
    MeasurementValidator: {
      checkId: (transactionId, param, errors) => {
        if(false===(param && typeof param === 'string' && param.length > 0)) {
          errors.push(new TransactionError('Missing or invalid "asset.id" defined on transaction', transactionId, '.asset.id', param, 'A string'))
        }
      },
      checkTemperature: (transactionId, param, errors) => {
        try {
            // check temperature against sensor calibration range
            if(isNaN(param)) {
              errors.push(new TransactionError('"Invalid temperature" on transaction', transactionId, '.asset.temperature', param, 'Temperature is not a number'))
            } else {
              let temperature = Number(param);
              if(temperature<-60||temperature>250) {
                errors.push(new TransactionError('"asset.temperature" out of calibration range  on transaction', transactionId, '.asset.temperature', param, 'Temperature between -60 and 250 degrees celcius'))
              };
            }
        } catch(err) {
            errors.push(new TransactionError('Missing or invalid "asset.temperature" on transaction', transactionId, '.asset.temperature', param, 'A valid Number string %s' + err.message))
        }
      },
      checkLocation: (transactionId, param, errors) => {
        try {
            if (false===
              ("latitude" in param && "longitude" in param &&
              typeof param.latitude === 'string' && param.latitude.length > 0 &&
              typeof param.longitude === 'string' && param.latitude.length > 0)) {
                errors.push(new TransactionError('Missing or invalid "asset.latitude" or "asset.longitude" defined on transaction', transactionId, '.asset.latitude | longitude', param, 'A valid cyphered string'));
              }
        } catch(err) {
            errors.push(new TransactionError('Missing or invalid "asset.latitude" or "asset.longitude" defined on transaction', transactionId, '.asset.latitude | longitude', param, 'A valid cyphered string'));
        }
      }
  }
};
