'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CaptureEndpointSchema extends Schema {
  up () {
    this.create('capture_endpoints', (table) => {
      table.increments()
      table.string('name', 80);
      table.text('mapping').defaultTo('{}');
      table.string('type', 80).defaultTo('direct');
      table.string('hash', 80);
      table.text('tags').defaultTo('[]');
      table.text('autoexports').defaultTo('[]');
      table.timestamps()
    })
  }

  down () {
    this.drop('capture_endpoints')
  }
}

module.exports = CaptureEndpointSchema
