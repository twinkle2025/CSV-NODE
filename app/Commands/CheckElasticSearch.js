'use strict'

const { Command } = require('@adonisjs/ace')

class CheckElasticSearch extends Command {
  static get signature () {
    return 'check:elasticsearch'
  }

  static get description () {
    return 'Ping Elasticsearch to ensure that the service is working'
  }

  async handle (args, options) {
    const {client} = require('../Services/elasticsearch');
    try {
      const pingResult = await client.ping();
      console.log(pingResult);
      this.success('Elasticsearch is running and reachable');
    } catch (error) {
      this.warn('Elasticsearch Failed to Connect');
      this.error(error);
    }
    process.exit(0);
  }
}

module.exports = CheckElasticSearch
