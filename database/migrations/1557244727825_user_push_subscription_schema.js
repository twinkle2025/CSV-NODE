'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserPushSubscriptionSchema extends Schema {
  up () {
    this.create('user_push_subscriptions', (table) => {
      table.increments()
      table.text('subscription').defaultTo('{}');
      table.timestamps()
    })
  }

  down () {
    this.drop('user_push_subscriptions')
  }
}

module.exports = UserPushSubscriptionSchema
