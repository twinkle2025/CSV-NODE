'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ImportJobSchema extends Schema {
  up () {
    this.create('import_jobs', (table) => {
      table.increments()
      table.integer('file_id').unsigned().references('id').inTable('files');
      table.string('status').defaultTo('new');
      table.integer('total_rows');
      table.integer('processed_rows');
      table.integer('valid_rows');
      table.integer('duplicate_rows');
      table.integer('invalid_rows');
      table.timestamps()
    })
  }

  down () {
    this.drop('import_jobs')
  }
}

module.exports = ImportJobSchema
