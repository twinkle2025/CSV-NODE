'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TransferJob extends Model {
    static boot () {
        super.boot()

        /**
         * A hook to stringify the column_settings before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (item) => {
            if (item.dirty.auth) {
                item.auth = JSON.stringify(item.auth);
            }
            if (item.dirty.options) {
                item.options = JSON.stringify(item.options);
            }
        });

        this.addHook('afterSave', async (item) => {
            if ('string' === typeof(item.auth)) {
                item.auth = JSON.parse(item.auth);
            }
            if ('string' === typeof(item.options)) {
                item.options = JSON.parse(item.options);
            }
            const io = require('../Controllers/Ws/socket.io');
            io.emit('transfer', {item});
        });

        this.addHook('afterFind', async (item) => {
            if ('string' === typeof(item.auth)) {
                item.auth = JSON.parse(item.auth);
            }
            if ('string' === typeof(item.options)) {
                item.options = JSON.parse(item.options);
            }
        });

        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.auth)) {
                    item.auth = JSON.parse(item.auth);
                }
                if ('string' === typeof(item.options)) {
                    item.options = JSON.parse(item.options);
                }
            }
          })
    }
}

module.exports = TransferJob
