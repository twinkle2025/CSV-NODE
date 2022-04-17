'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ExportTemplateSchema extends Schema {
  up () {
    this.create('export_templates', (table) => {
      table.increments()
      table.string('name', 80);
      table.text('export_columns').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('export_templates')
  }
}

module.exports = ExportTemplateSchema
