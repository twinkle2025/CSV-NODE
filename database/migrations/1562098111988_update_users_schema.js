'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateUsersSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.boolean('active').defaultTo(true);
    });
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateUsersSchema
