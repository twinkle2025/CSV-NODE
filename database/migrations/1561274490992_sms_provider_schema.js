'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SmsProviderSchema extends Schema {
  up () {
    this.create('sms_providers', (table) => {
      table.increments()
      table.string('name', 80);
      table.string('service', 80);
      table.text('configuration').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('sms_providers')
  }
}

module.exports = SmsProviderSchema
