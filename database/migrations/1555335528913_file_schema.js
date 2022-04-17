'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FileSchema extends Schema {
  up () {
    this.create('files', (table) => {
      table.increments()
      table.text('name').notNullable();
      table.string('drive', 80).notNullable();
      table.string('key', 191).notNullable().unique();
      table.text('path').notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('files')
  }
}

module.exports = FileSchema
