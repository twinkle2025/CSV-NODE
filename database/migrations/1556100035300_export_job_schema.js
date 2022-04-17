'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ExportJobSchema extends Schema {
  up () {
    this.create('export_jobs', (table) => {
      table.increments()
      table.string('status').defaultTo('new');
      table.integer('total_rows').defaultTo(0);
      table.integer('processed_rows').defaultTo(0);
      table.string('drive', 80);
      table.text('drive_name');
      table.text('drive_path');
      table.text('filter_query').notNullable();
      table.boolean('filter_is_advanced').notNullable().defaultTo(false);
      table.string('export_name').notNullable();
      table.string('export_format', 80).notNullable();
      table.text('export_columns').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('export_jobs')
  }
}

module.exports = ExportJobSchema
