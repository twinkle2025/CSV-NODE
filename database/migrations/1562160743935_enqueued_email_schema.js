'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EnqueuedEmailSchema extends Schema {
  up () {
    this.create('enqueued_emails', (table) => {
      table.increments()
      table.timestamp('send_at').defaultTo(this.fn.now());
      table.string('status', 254).defaultTo('new').notNullable();
      table.string('to_email', 254).notNullable();
      table.string('to_name', 254).notNullable();
      table.string('lead_id', 254).notNullable();
      table.text('subject').notNullable();
      table.text('content_html').notNullable();
      table.text('content_text').notNullable();
      table.boolean('started').defaultTo(false);
      table.integer('email_account_id').unsigned().defaultTo(0);
      table.integer('proxy_id').unsigned().defaultTo(0);
      table.boolean('failed_proxy').defaultTo(false);
      table.boolean('failed_email_account').defaultTo(false);
      table.boolean('failed_spam').defaultTo(false);
      table.boolean('failed_other').defaultTo(false);
      table.timestamps()
    })
  }

  down () {
    this.drop('enqueued_emails')
  }
}

module.exports = EnqueuedEmailSchema
