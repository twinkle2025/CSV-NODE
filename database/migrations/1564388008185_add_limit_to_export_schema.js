'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLimitToExportSchema extends Schema {
  up () {
    this.table('export_jobs', (table) => {
      table.integer('limit').defaultTo(-1);
    })
  }

  down () {
    this.table('export_jobs', (table) => {
      table.dropColumn('limit');
    })
  }
}

module.exports = AddLimitToExportSchema
