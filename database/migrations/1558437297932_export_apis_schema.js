'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ExportApisSchema extends Schema {
  up () {
    this.create('export_apis', (table) => {
      table.increments()
      table.string('name', 80);
      table.string('service', 80);
      table.text('configuration').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('export_apis')
  }
}

module.exports = ExportApisSchema
