const { BaseTransaction, TransactionError } = require('@liskhq/lisk-transactions');
const { MeasurementValidator } = require('./measurement.utils.js');

class RegisterMeasurementTransaction extends BaseTransaction {
    static get TYPE () {
        return 24;
    }

    validateAsset() {
        const errors = [];

        // these calls check asset properties, adds error object when not valid
        MeasurementValidator.checkId(this.id, this.asset.id,errors);
        // MeasurementValidator.checkTemperature(this.id, this.asset.temperature,errors);
        // MeasurementValidator.checkLocation(this.id, this.asset.location,errors);

        return errors;
    }

    async prepare(store) {
        return Promise.all([
            super.prepare(store),
            store.account.cache([ { address: this.senderId }]),
        ]);
    }

    applyAsset(store) {
        const errors = [];

        const packet = store.account.get(this.senderId);
        if (packet === undefined) {
          errors.push(new TransactionError("packet not found", this.id, "this.asset.id", this.asset.id, "An existing packet ID on recipient account"));
        }
        
        if(packet.status==='ongoing'||packet.status==='alarm') {
          let timestamp = dateToLiskEpochTimestamp(new Date());
          if(false === "asset" in packet) { packet.asset = {} };
          if(false === "measurements" in packet.asset) { packet.asset.measurements = [] };
          packet.asset.transportstatus = 'active';
          packet.asset.measurements.push({ timestamp: this.asset.timestamp,  temperature: this.asset.temperature, humidity: this.asset.humidity });
          store.account.set(packet.address, packet);
        }
        
        return errors;
    }

    undoAsset(store) {
        const errors = [];
        const packet = store.account.get(this.asset.id);
        if (packet === undefined) {
          errors.push(new TransactionError("packet not found", this.id, "this.asset.id", this.asset.id, "An existing packet ID on recipient account"));
        }
        
        if(packet.status==='ongoing') {
          packet.asset.measurements.pop(); // discard added measurements
        }

        store.account.set(this.asset.id, packet);

        return errors;
    }
}

module.exports = RegisterMeasurementTransaction;