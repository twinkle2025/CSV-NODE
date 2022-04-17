'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MessageBlastSchema extends Schema {
  up () {
    this.create('message_blasts', (table) => {
      table.increments()
      table.string('name', 80);
      table.string('service', 80);
      table.text('configuration').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('message_blasts')
  }
}

module.exports = MessageBlastSchema
