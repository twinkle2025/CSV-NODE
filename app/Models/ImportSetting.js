'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ImportSetting extends Model {
    static boot () {
        super.boot()

        /**
         * A hook to stringify the column_settings before saving
         * it to the database.
         */
        this.addHook('beforeSave', async (importSettingInstance) => {
            if (importSettingInstance.dirty.column_settings) {
                importSettingInstance.column_settings = JSON.stringify(importSettingInstance.column_settings);
            }
            if (importSettingInstance.dirty.conversion_settings) {
                importSettingInstance.conversion_settings = JSON.stringify(importSettingInstance.conversion_settings);
            }
        });

        this.addHook('afterSave', async (importSettingInstance) => {
            if ('string' === typeof(importSettingInstance.column_settings)) {
                importSettingInstance.column_settings = JSON.parse(importSettingInstance.column_settings);
            }
            if ('string' === typeof(importSettingInstance.conversion_settings)) {
                importSettingInstance.conversion_settings = JSON.parse(importSettingInstance.conversion_settings);
            }
        });

        this.addHook('afterFind', async (importSettingInstance) => {
            if ('string' === typeof(importSettingInstance.column_settings)) {
                importSettingInstance.column_settings = JSON.parse(importSettingInstance.column_settings);
            }
            if ('string' === typeof(importSettingInstance.conversion_settings)) {
                importSettingInstance.conversion_settings = JSON.parse(importSettingInstance.conversion_settings);
            }
        });

        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.column_settings)) {
                    item.column_settings = JSON.parse(item.column_settings);
                }
                if ('string' === typeof(item.conversion_settings)) {
                    item.conversion_settings = JSON.parse(item.conversion_settings);
                }
            }
          })
    }

    file () {
        return this.belongsTo('App/Models/File')
    }
}

module.exports = ImportSetting
