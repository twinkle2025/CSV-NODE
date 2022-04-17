'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const client = use('elasticsearch');

class ElasticsearchClickIndexSchema extends Schema {
  async up () {
    try {
      await client.indices.create({
        index: 'clicks',
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
              reviewed: {
                type: 'boolean',
              },
              email: {
                properties: {
                  supressed: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'text',
                    analyzer: 'bastion_analyzer',
                    term_vector: 'yes',
                    fielddata: true,
                  },
                  reason: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  }
                }
              },
              domain: {
                properties: {
                  supressed: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  },
                  reason: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  }
                }
              },
              ip: {
                properties: {
                  supressed: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'ip',
                  },
                  reason: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  }
                }
              },
              ua: {
                properties: {
                  supressed: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  },
                  reason: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
                  }
                }
              },
              country: {
                properties: {
                  supressed: {
                    type: 'boolean',
                  },
                  value: {
                    type: 'keyword',
                  },
                  reason: {
                    type: 'text',
                    term_vector: 'yes',
                    fielddata: true,
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
      index: 'clicks',
    });
  }
}

module.exports = ElasticsearchClickIndexSchema
