'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EnqueuedMessageSchema extends Schema {
  up () {
    this.create('enqueued_messages', (table) => {
      table.increments()
      table.string('status', 80);
      table.string('method', 80);
      table.integer('method_id').unsigned();
      table.integer('blast_id').unsigned().references('id').inTable('message_blasts');
      table.string('lead_id', 120);
      table.string('destination', 120);
      table.text('subject')
      table.text('body')
      table.timestamp('send_at').defaultTo(this.fn.now());
      table.timestamps()
    })
  }

  down () {
    this.drop('enqueued_messages')
  }
}

module.exports = EnqueuedMessageSchema
