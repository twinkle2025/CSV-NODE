'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EnqueuedJobsSchema extends Schema {
  up () {
    this.create('enqueued_jobs', (table) => {
      table.increments()
      table.string('type').notNullable();
      table.integer('job_id').unsigned().notNullable();
      table.boolean('has_started').notNullable().defaultTo(false);
      table.timestamps()
    })
  }

  down () {
    this.drop('enqueued_jobs')
  }
}

module.exports = EnqueuedJobsSchema
