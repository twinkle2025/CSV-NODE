'use strict'

const { Command } = require('@adonisjs/ace')

class GetDuplicatesFromElasticsearch extends Command {
  static get signature () {
    return `
      load:duplicates
      { --flush : Flush the Redis Cache before updating }
    `
  }

  static get description () {
    return 'Load Emails and Phones from Elasticsearch and save them in Redis for use in the duplicate checking mechanism'
  }

  async handle (args, flags) {
    if (flags.flush) {
      this.info('Flushing the Redis Cache');  
      const Redis = use('Redis');
      const res = await Redis.flushdb();
      this.info(`Redis DB Flush returned ${res}`);
    }
    const client = use('Elasticsearch');
    this.info('Fetching Leads from Elasticsearch');
    let scroll;
    let iteration = 0;
    let expectedIterations = 0;
    let promises = [];
    const query = {
      index: 'leads',
      scroll: '1m',
      size: 5000,
      _source: true,
      body: {
        query: {
          match_all: {}
        }
      }
    }
    try {
      let {body} = await client.search(query);
      if ('object' === typeof(body)) {
        if ('string' === typeof(body['_scroll_id'])) {
          scroll = body['_scroll_id'];
          expectedIterations = Math.ceil(body.hits.total.value / 5000);
        }
        if (Array.isArray(body.hits.hits)) {
          body.hits.hits.forEach((hit) => {
            promises.push(this.handleElasticsearchHit(hit));
          });
        }
      }
      this.info(`fetching ${iteration}/${expectedIterations}`);
    } catch (error) {
      this.error(error);
    }
    await Promise.all(promises);
    promises = [];
    while (scroll && iteration <= expectedIterations ) {
      this.info(`fetching ${iteration}/${expectedIterations}`);
      const query = {
          scroll_id: scroll,
          scroll: '1m',
      }
      try {
        let {body} = await client.scroll(query);
        scroll = body['_scroll_id'];
        body.hits.hits.forEach((hit) => {
          promises.push(this.handleElasticsearchHit(hit));
        });
      } catch (error) {
        this.error(error);
      }
      await Promise.all(promises);
      promises = [];
      iteration ++;
    }
    this.success('Done');
    process.exit();
  }

  async handleElasticsearchHit(hit) {
    const id = hit['_id'];
    const email = ('object' === typeof(hit['_source'].email) && 'undefined' !== typeof(hit['_source'].email.value)) ? hit['_source'].email.value : null;
    const phone = ('object' === typeof(hit['_source'].phone) && 'undefined' !== typeof(hit['_source'].phone.value)) ? hit['_source'].phone.value : null;
    const importer = use('importer');
    const promises = [];
    if (null !== email) {
      promises.push(importer.setDuplicateId('email', email, id));
    }
    if (null !== phone) {
      promises.push(importer.setDuplicateId('phone', phone, id));
    }
    const stored = await Promise.all(promises);
    console.log(stored, email, phone, id);
    return stored;
  }
}

module.exports = GetDuplicatesFromElasticsearch
