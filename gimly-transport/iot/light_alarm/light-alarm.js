/*
 * Copyright © 2020 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions');

/**
 * Send light alarm transaction when the packet has been opened (accepts timestamp).
 * Self-signed by packet.
 */
class LightAlarmTransaction extends BaseTransaction {

    static get TYPE () {
        return 23;
    }

    static get FEE () {
        return '0';
    };

    async prepare(store) {
        await store.account.cache([
            {
                address: this.senderId,
            }
        ]);
    }

    validateAsset() {
        const errors = [];
        /*
        Implement your own logic here.
        Static checks for presence of `timestamp` which holds the timestamp of when the alarm was triggered
        */
        if("timestamp" in this === false) {
          errors.push(
            new TransactionError(
              'timestamp missing for this alarm',
            	this.id,
            	'.timestamp',
              'missing',
              'A numerical value representing a timestamp')
          )
        } else if(isNaN(this.timestamp) === true) {
          errors.push(
            new TransactionError(
              'invalid timestamp set for this alarm',
            	this.id,
            	'.timestamp',
              this.timestamp,
              'A numerical value representing a timestamp')
          )
        }

        return errors;
    }

    /*Inside of `applyAsset`, it is possible to utilise the cached data from the `prepare` function,
     * which is stored inside of the `store` parameter.*/
    applyAsset(store) {
        const errors = [];

        /* With `store.account.get(ADDRESS)` the account data of the packet account can be seen.
         * `this.senderId` is specified as an address, due to the fact that the light alarm is always signed and sent by the packet itself. */
        const packet = store.account.get(this.senderId);

        /**
         * Update the Packet account:
         * - set packet status to "alarm"
         * - add current timestamp to light alarms list
         */
        packet.asset.status = 'alarm';
        packet.asset.alarms = packet.asset.alarms ? packet.asset.alarms : {};
        packet.asset.alarms.light = packet.asset.alarms.light ? packet.asset.alarms.light : [];
        packet.asset.alarms.light.push(this.timestamp);

        /* When all changes have been made they are applied to the database by executing `store.account.set(ADDRESS, DATA)`; */
        store.account.set(packet.address, packet);

        /* Unlike in `validateAsset`, the `store` parameter is present here.
         * Therefore inside of `applyAsset` it is possible to make dynamic checks against the existing data in the database.
         *  As this is not required here, an empty `errors` array is returned at the end of the function. */
        return errors;
    }
    
    undoAsset(store) {
        const errors = [];
        const packet = store.account.get(this.senderId);

        /* --- Revert packet status --- */
        packet.asset.status = null;
        packet.asset.alarms.light.pop();

        store.account.set(packet.address, packet);
        return errors;
    }

}

module.exports = LightAlarmTransaction;
