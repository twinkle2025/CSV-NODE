'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ExportApi extends Model {
    static boot () {
        super.boot()

        /**
         * A hook to stringify the configuration before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (item) => {
            if (item.dirty.configuration) {
                item.configuration = JSON.stringify(item.configuration);
            }
        });

        this.addHook('afterSave', async (item) => {
            if ('string' === typeof(item.configuration)) {
                item.configuration = JSON.parse(item.configuration);
            }
        });

        this.addHook('afterSave', async (job) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('export-api', {job});
        });

        this.addHook('afterFind', async (item) => {
            if ('string' === typeof(item.configuration)) {
                item.configuration = JSON.parse(item.configuration);
            }
        });

        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.configuration)) {
                    item.configuration = JSON.parse(item.configuration);
                }
            }
          })
    }
}

module.exports = ExportApi
