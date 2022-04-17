'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    node: Env.get('ES_HOST', 'http://localhost:9200'),
}
