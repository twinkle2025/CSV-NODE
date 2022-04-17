'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ImportSettingSchema extends Schema {
  up () {
    this.create('import_settings', (table) => {
      table.increments()
      table.integer('file_id').unsigned().references('id').inTable('files');
      table.string('filetype', 20).notNullable();
      table.string('column_delimiter', 20).notNullable();
      table.string('column_quotation', 3);
      table.integer('header_row');
      table.text('column_settings').defaultTo('{}');
      table.text('tags').defaultTo('');
      table.timestamps()
    })
  }

  down () {
    this.drop('import_settings')
  }
}

module.exports = ImportSettingSchema
