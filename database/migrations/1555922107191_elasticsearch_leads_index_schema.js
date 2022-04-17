'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const {client} = require('../../app/Services/elasticsearch');

class ElasticsearchLeadsIndexSchema extends Schema {
  async up () {
    try {
      await client.indices.create({
        index: 'leads',
        body: {
          settings: {
            analysis: {
              analyzer: {
                bastion_analyzer: {
                  tokenizer: 'bastion_tokenizer',
                }
              },
              tokenizer: {
                bastion_tokenizer: {
                  type: 'uax_url_email',
                  max_token_length: 5
                }
              }
            },
          },
          mappings: {
            properties: {
              ip: {
                type: 'ip',
              },
              fname: {
                type: 'text',
              },
              mname: {
                type: 'text',
              },
              lname: {
                type: 'text',
              },
              email: {
                properties: {
                  valid: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'text',
                    analyzer: 'bastion_analyzer',
                    term_vector: 'yes',
                    fielddata: true,
                  }
                }
              },
              phone: {
                properties: {
                  is_landline: {
                    type: 'boolean',
                  },
                  is_mobile: {
                    type: 'boolean',
                  },
                  iso: {
                    type: 'keyword',
                  },
                  preview: {
                    type: 'text',
                  },
                  type: {
                    type: 'integer',
                  },
                  valid: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'text',
                  }
                }
              },
              country: {
                properties: {
                  valid: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'keyword',
                  }
                }
              },
              created_at: {
                type: 'date',
              },
              updated_at: {
                type: 'date',
              },
            }
          }
        }
      });
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      throw new Error('Failed to create index');
    }
  }

  async down () {
    await client.indices.delete({
      index: 'leads',
    });
  }
}

module.exports = ElasticsearchLeadsIndexSchema
