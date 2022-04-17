'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const client = use('elasticsearch');

class SetConversionsAsNestedSchema extends Schema {
  async up () {
    const query = {
      index: 'leads',
      body: {
        properties: {
          lead_conversions: {
            type: 'nested',
          }
        }
      }
    }
    try {
      await client.indices.putMapping(query);
    } catch (error) {
      if (error.meta && error.meta.body) {
        console.warn(error.meta.body.error);
      }
      throw error;
    }
  }

  down () {}
}

module.exports = SetConversionsAsNestedSchema
