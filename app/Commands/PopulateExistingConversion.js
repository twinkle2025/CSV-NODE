'use strict'

const { Command } = require('@adonisjs/ace')
const client = use('elasticsearch');

class PopulateExistingConversion extends Command {
  static get signature () {
    return 'populate:conversions'
  }

  static get description () {
    return 'Find all leads which have `converions` but do not have `lead_conversions` and update them'
  }

  async handle (args, options) {
    this.info('Fetching Leads from Elasticsearch');
    const chunkedForEach = use('chunkedForEach');
    let scroll;
    let iteration = 0;
    let expectedIterations = 0;
    let promises = [];
    const query = {
      index: 'leads',
      scroll: '30m',
      size: 5000,
      _source: true,
      body: {
        query: {
          bool: {
            must: [
              {
                exists: {
                  field: 'conversions',
                }
              }
            ],
            must_not: [
              {
                exists: {
                  field: 'lead_conversions',
                }
              }
            ],
          }
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
          await chunkedForEach(body.hits.hits, 50, async({value}) => {
            await this.handleElasticsearchHit(value);
          });
        }
      }
      this.info(`fetching ${iteration}/${expectedIterations}`);
    } catch (error) {
      this.error(error);
    }
    promises = [];
    while (scroll && iteration <= expectedIterations ) {
      this.info(`fetching ${iteration}/${expectedIterations}`);
      const query = {
          scroll_id: scroll,
          scroll: '30m',
      }
      try {
        let {body} = await client.scroll(query);
        scroll = body['_scroll_id'];
        await chunkedForEach(body.hits.hits, 50, async({value}) => {
          await this.handleElasticsearchHit(value);
        });
      } catch (error) {

        this.error(error);
      }
      promises = [];
      iteration ++;
    }
    this.success('Done');
    process.exit();
  }

  async handleElasticsearchHit(hit) {
    const leadId = hit['_id'];
    const source = hit['_source'];
    if (Array.isArray(source.conversions)) {
      source.lead_conversions = source.conversions;
    }
    try {
      const {body} = await client.update({
        index: 'leads',
        refresh: true,
        retry_on_conflict: 5,
        id: leadId,
        body: {
            doc: source
        },
      });
      this.success(`Updated lead ${leadId} successfully`);
    } catch (error) {
      console.warn(`Error updating lead ${leadId}: ${error.toString()}`);
      console.warn(error.meta.body.error);
    }
  }
}

module.exports = PopulateExistingConversion
