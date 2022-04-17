'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateImportedBytesForTransferJobsSchema extends Schema {
  up () {
    this.table('transfer_jobs', (table) => {
      table.bigInteger('imported_bytes').defaultTo(0).alter();
    })
  }

  down () {
    this.table('transfer_jobs', (table) => {
      table.integer('imported_bytes').defaultTo(0).alter();
    })
  }
}

module.exports = UpdateImportedBytesForTransferJobsSchema
