'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ExportTemplate extends Model {
    static boot () {
        super.boot()

        /**
         * A hook to stringify the export_columns before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (importSettingInstance) => {
            if (importSettingInstance.dirty.export_columns) {
                importSettingInstance.export_columns = JSON.stringify(importSettingInstance.export_columns);
            }
        });

        this.addHook('afterSave', async (importSettingInstance) => {
            if ('string' === typeof(importSettingInstance.export_columns)) {
                importSettingInstance.export_columns = JSON.parse(importSettingInstance.export_columns);
            }
        });

        this.addHook('afterSave', async (job) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('export-template', {job});
        });

        this.addHook('afterFind', async (importSettingInstance) => {
            if ('string' === typeof(importSettingInstance.export_columns)) {
                importSettingInstance.export_columns = JSON.parse(importSettingInstance.export_columns);
            }
        });

        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.export_columns)) {
                    item.export_columns = JSON.parse(item.export_columns);
                }
            }
          })
    }
}

module.exports = ExportTemplate
