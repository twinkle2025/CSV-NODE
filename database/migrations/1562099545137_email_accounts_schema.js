'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EmailAccountsSchema extends Schema {
  up () {
    this.create('email_accounts', (table) => {
      table.increments()
      table.string('email', 254).notNullable();
      table.string('name', 254).notNullable().defaultTo('');
      table.string('host', 254).notNullable();
      table.string('port', 254).notNullable();
      table.string('user', 254).notNullable();
      table.string('password', 254).notNullable();
      table.string('encryption', 254).notNullable();
      table.integer('max_hourly').unsigned().defaultTo(0);
      table.integer('max_daily').unsigned().defaultTo(0);
      table.integer('current_hourly').unsigned().defaultTo(0);
      table.integer('current_daily').unsigned().defaultTo(0);
      table.boolean('active').defaultTo(true);
      table.timestamps()
      table.unique(['email', 'host']);
    })
  }

  down () {
    this.drop('email_accounts')
  }
}

module.exports = EmailAccountsSchema
