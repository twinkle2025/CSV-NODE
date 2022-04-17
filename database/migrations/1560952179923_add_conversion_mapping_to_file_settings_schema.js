'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddConversionMappingToFileSettingsSchema extends Schema {
  up () {
    this.table('import_settings', (table) => {
      table.text('conversion_settings').defaultTo('{}');
    })
  }

  down () {
    this.table('import_settings', (table) => {
      // reverse alternations
      table.dropColumn('conversion_settings')
    })
  }
}

module.exports = AddConversionMappingToFileSettingsSchema
