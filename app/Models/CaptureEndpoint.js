'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CaptureEndpoint extends Model {
    static boot () {
        super.boot()

        /**
         * A hook to stringify the configuration before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (item) => {
            if (item.dirty.tags) {
                item.tags = JSON.stringify(item.tags);
            }
            if (item.dirty.autoexports) {
                item.autoexports = JSON.stringify(item.autoexports);
            }
            if (item.dirty.mapping) {
                item.mapping = JSON.stringify(item.mapping);
            }
        });

        this.addHook('afterSave', async (item) => {
            if ('string' === typeof(item.tags)) {
                item.tags = JSON.parse(item.tags);
            }
            if ('string' === typeof(item.autoexports)) {
                item.autoexports = JSON.parse(item.autoexports);
            }
            if ('string' === typeof(item.mapping)) {
                item.mapping = JSON.parse(item.mapping);
            }
        });

        this.addHook('afterSave', async (item) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('capture-endpoint', {item});
        });

        this.addHook('afterFind', async (item) => {
            if ('string' === typeof(item.tags)) {
                item.tags = JSON.parse(item.tags);
            }
            if ('string' === typeof(item.autoexports)) {
                item.autoexports = JSON.parse(item.autoexports);
            }
            if ('string' === typeof(item.mapping)) {
                item.mapping = JSON.parse(item.mapping);
            }
        });

        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.tags)) {
                    item.tags = JSON.parse(item.tags);
                }
                if ('string' === typeof(item.autoexports)) {
                    item.autoexports = JSON.parse(item.autoexports);
                }
                if ('string' === typeof(item.mapping)) {
                    item.mapping = JSON.parse(item.mapping);
                }
            }
          })
    }
}

module.exports = CaptureEndpoint
