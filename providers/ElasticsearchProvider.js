'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ElasticsearchProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('elasticsearch', () => {
        const Config = this.app.use('Adonis/Src/Config')
        const { Client } = require('@elastic/elasticsearch')
        const client = new Client(Config.get('elasticsearch'));
        return client;
    });
    this.app.singleton('Elasticsearch', () => {
        return this.app.use('elasticsearch');
    });
    this.app.singleton('esqueue', () => {
      const {queue} =  require('../app/Services/elasticsearch')
      return queue;
  });
  }
}

module.exports = ElasticsearchProvider
