'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMessageBlastIdToEnqueuedEmailsSchema extends Schema {
  up () {
    this.table('enqueued_emails', (table) => {
      table.integer('message_blast_id').unsigned().defaultTo(0);
    })
  }

  down () {
    this.table('enqueued_emails', (table) => {
      table.dropColumn('message_blast_id');
    })
  }
}

module.exports = AddMessageBlastIdToEnqueuedEmailsSchema
