'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProxiesSchema extends Schema {
  up () {
    this.create('proxies', (table) => {
      table.increments()
      table.string('type', 254).notNullable();
      table.string('host', 254).notNullable();
      table.string('port', 254).notNullable();
      table.integer('email_account_id').unsigned().defaultTo(0);
      table.boolean('active').defaultTo(true);
      table.timestamps()
      table.unique(['host', 'port']);
    })
  }

  down () {
    this.drop('proxies')
  }
}

module.exports = ProxiesSchema
