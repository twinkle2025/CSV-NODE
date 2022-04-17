'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TransferJobsSchema extends Schema {
  up () {
    this.create('transfer_jobs', (table) => {
      table.increments()
      table.string('status').defaultTo('new');
      table.string('service', 20).notNullable();
      table.text('auth').defaultTo('{}');
      table.text('options').defaultTo('{}');
      table.integer('imported_bytes').defaultTo(0);
      table.text('name').notNullable();
      table.text('tmp_path');
      table.integer('file_id').unsigned().references('id').inTable('files');
      table.timestamps();
    })
  }

  down () {
    this.drop('transfer_jobs')
  }
}

module.exports = TransferJobsSchema
