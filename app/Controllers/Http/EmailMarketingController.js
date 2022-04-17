'use strict'

const supressionLists = require('../../Services/supression-lists');
const client = use('elasticsearch');
const notifier = use('Notifier');
const newrelic = require('newrelic');

class EmailMarketingController {
    listSupressedEmails({response}) {
        try {
            return response.api(200, Array.from(supressionLists.emails));
        } catch (error) {
            return response.api(500, null, [{message: error.toString()}]);
        }
    }

    listSupressedDomains({response}) {
        try {
            return response.api(200, Array.from(supressionLists.domains));
        } catch (error) {
            return response.api(500, null, [{message: error.toString()}]);
        }
    }

    populateFromElasticsearch({response, params}) {
        switch (params.list) {
            case 'emails':
                notifier.emit(`${params.list}-supression-list-reloading`, true);
                response.api(200);
                break;

            case 'domains':
                notifier.emit(`${params.list}-supression-list-reloading`, true);
                response.api(200);
                break;

            default:
                return response.api(400, null, [{message: 'Unknown Supression List Type'}]);
        }
        this._populateSupressionListFromElasticsearch(params.list);
    }

    async _populateSupressionListFromElasticsearch(list) {
        const size = 5000;
        const query = {
            index: 'clicks',
            size,
            _source: true,
            scroll: '1m',
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    reviewed: true,
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {created_at: 'desc'},
                    {updated_at: 'asc'},
                    '_score',
                ],
            }
        };
        let total = 0;
        let iterations = 0;
        let scroll;
        switch (list) {
            case 'emails':
                query.body.query.bool.must.push({
                    term: {
                        'email.supressed': true,
                    }
                })
                break;

            case 'domains':
                query.body.query.bool.must.push({
                    term: {
                        'domain.supressed': true,
                    }
                })
                break;

            default:
                notifier.emit(`${list}-supression-list-reloaded`, true);
                return false;
        }
        try {
            const {body} = await client.search(query);
            if ('string' === typeof(body._scroll_id)) {
                scroll = body._scroll_id;
                total = body.hits.total.value;
                iterations = Math.ceil(total / size);
                body.hits.hits.forEach((click) => {
                    switch(list) {
                        case 'emails':
                            supressionLists.emails.add(click._source.email.value);
                            break;

                        case 'domains':
                            supressionLists.domains.add(click._source.domain.value);
                            break;
                    }
                });
            }
        } catch (error) {
            console.warn(`Error Fetching Supression List for ${list}: ${error.toString()}`);
            console.warn(error);
        }
        if (scroll) {
            for (let i = 0; i < iterations; i++) {
                const query = {
                    scroll_id: scroll,
                    scroll: '1m',
                }
                try {
                    const {body} = await client.scroll(query);
                    scroll = body._scroll_id;
                    body.hits.hits.forEach((click) => {
                        switch(list) {
                            case 'emails':
                                supressionLists.emails.add(click._source.email.value);
                                break;
    
                            case 'domains':
                                supressionLists.domains.add(click._source.domain.value);
                                break;
                        }
                    });
                } catch (error) {
                    console.warn(`Error Fetching Scrolled Supression List for ${list}: ${error.toString()}`);
                    console.warn(error);
                }
            }
        }
        await supressionLists.storeListsToRedis();
        notifier.emit(`${list}-supression-list-reloaded`, true);
    }
}

module.exports = EmailMarketingController
