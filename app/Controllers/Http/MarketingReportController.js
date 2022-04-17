'use strict'

const client = use('elasticsearch');
const moment = require('moment');

class MarketingReportController {
    async getReportData({request, response, params}) {
        const req = request.all();
        const index = ('clicks' === params.type) ? 'clicks' : 'leads';
        const query = this._makeQuery(req, params);
        const promises = [];
        const start = moment(req.date.gte);
        const end = moment(req.date.lte);
        let diff = end.diff(start, 'days');
        if (diff < 0) {
            diff = diff * -1;
        }
        const interval = (diff < 2) ? 'hour' : 'day';
        promises.push(this._getTotalForQuery(query, index));
        promises.push(this._getHistographForQuery(query, index, start, end, interval));
        promises.push(this._getGeographForQuery(query, index));
        switch(params.type) {
            case 'clicks':
                promises.push(this._getTopAggregation(query, index, 'topBrowsers', 'meta.ua.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topDomains', 'domain.value', 10));
                promises.push(this._getTopAggregation(query, index, 'topSources', 'meta.source.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topSubSources', 'meta.aff_sub.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topOffers', 'meta.offer_id', 10));
                promises.push(this._getTopAggregation(query, index, 'topUrls', 'meta.url_id', 10));
                promises.push(this._getTopAggregation(query, index, 'topAffiliates', 'meta.aff_id', 10));
                promises.push(this._getTopAggregation(query, index, 'topRedirectDomains', 'meta.domain.keyword', 10));
                break;

            case 'subscriptions':
                promises.push(this._getTopAggregation(query, index, 'topNetworksByName', 'conversions.network_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topNetworksById', 'conversions.network.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topFunnelsByName', 'conversions.funnel_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topFunnelsById', 'conversions.funnel.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topAffiliatesByName', 'conversions.affiliate_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topAffiliatesById', 'conversions.affiliate.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topTags', 'tags', 10));
                break;

            case 'registrations':
                promises.push(this._getTopAggregation(query, index, 'topNetworksByName', 'conversions.network_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topNetworksById', 'conversions.network.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topFunnelsByName', 'conversions.funnel_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topFunnelsById', 'conversions.funnel.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topAffiliatesByName', 'conversions.affiliate_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topAffiliatesById', 'conversions.affiliate.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topTags', 'tags', 10));
                break;

            case 'ftds':
                promises.push(this._getTopAggregation(query, index, 'topBrokersByName', 'conversions.broker_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topBrokersById', 'conversions.broker.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topCurrencies', 'conversions.currency.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topTags', 'tags', 10));
                break;

            case 'upsales':
                promises.push(this._getTopAggregation(query, index, 'topBrokersByName', 'conversions.broker_name.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topBrokersById', 'conversions.broker.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topCurrencies', 'conversions.currency.keyword', 10));
                promises.push(this._getTopAggregation(query, index, 'topTags', 'tags', 10));
                break;

            case 'unsubscriptions':
                promises.push(this._getTopAggregation(query, index, 'topTags', 'tags', 10));
                break;
        }
        const results = await Promise.all(promises);
        let ret = {};
        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            ret = {...ret, ...res};
        }
        ret.query = query;
        return response.api(200, ret);
    }

    async _getTotalForQuery(query, index) {
        const ret = {
            total: null,
        };
        const q = {
            index,
            body: {
                query
            },
        }
        try {
            const {body} = await client.count(q);
            ret.total = body.count;
        } catch (error) {
            console.warn(`Failed to get count query ${JSON.stringify(q)} to error: ${error.toString()}`);
            console.warn(error.meta.body);
        }
        return ret;
    }

    async _getHistographForQuery(query, index, start, end, interval) {
        const ret = {
            histograph: [{
                data: [],
                name: 'Conversions',
            }],
        };
        const q = {
            index,
            size: 0,
            body: {
                query,
                aggs: {
                    conversion_histogram: {
                        date_histogram: {
                            field: ('clicks' === index) ? 'created_at' : 'conversions.date',
                            interval,
                            min_doc_count: 1,
                            missing: 0,
                        }
                    }
                }
            },
        }
        try {
            const {body} = await client.search(q);
            const buckets = body.aggregations.conversion_histogram.buckets;
            for (var m = moment(start); m.isBefore(end); m.add(1, `${interval}s`)) {
                let count = 0;
                for (let i = 0; i < buckets.length; i++) {
                    const bucket = buckets[i];
                    const bm = moment(bucket.key_as_string);
                    if (bm.isSame(m, interval)) {
                        count = bucket.doc_count;
                    }
                }
                ret.histograph[0].data.push([m.valueOf(), count]);
            }
        } catch (error) {
            console.warn(`Failed to get histograph for query ${JSON.stringify(q)} to error: ${error.toString()}`);
            console.warn(error.meta.body);
        }
        return ret;
    }

    async _getGeographForQuery(query, index) {
        const ret = {
            geograph: [],
        };
        const q = {
            index,
            size: 0,
            body: {
                query,
                aggs: {
                    top_countries: {
                        terms: {
                            field: 'country.value',
                            size: 300,
                        }
                    }
                }
            },
        }
        try {
            const {body} = await client.search(q);
            const data = [];
            for (let i = 0; i < body.aggregations.top_countries.buckets.length; i++) {
                const bucket = body.aggregations.top_countries.buckets[i];
                data.push({
                    key: bucket.key.toLowerCase(),
                    value: bucket.doc_count
                });
            }
            const serieses = [{
                data,
                keys: ['hc-key', 'value'],
                joinBy: ['hc-key', 'key'],
                name: 'Conversions',
            }];
            ret.geograph = serieses;
        } catch (error) {
            console.warn(`Failed to get geograph for query ${JSON.stringify(q)} to error: ${error.toString()}`);
            console.warn(error.meta.body);
        }
        return ret;
    }

    async _getTopAggregation(query, index, key, field, size) {
        const ret = {};
        ret[key] = [];
        const q = {
            index,
            size: 0,
            body: {
                query,
                aggs: {
                    top: {
                        terms: {
                            field,
                            size
                        }
                    }
                }
            },
        }
        try {
            const {body} = await client.search(q);
            const serieses = [];
            for (let i = 0; i < body.aggregations.top.buckets.length; i++) {
                const bucket = body.aggregations.top.buckets[i];
                serieses.push({
                    type: 'column',
                    name: bucket.key,
                    data: [bucket.doc_count],
                });
            }
            ret[key] = serieses;
        } catch (error) {
            console.warn(`Failed to get top aggregation for key ${key} with query ${JSON.stringify(q)} to error: ${error.toString()}`);
            console.warn(error.meta.body);
        }
        return ret;
    }

    _makeQuery(req, params) {
        let nested;
        const query = {
            bool: {
                must: [],
            }
        }
        switch(true) {
            case (['clicks'].indexOf(params.type) > -1):
                query.bool.must.push({
                    range: {
                        created_at: req.date,
                    }
                })
                if (Array.isArray(req.countries) && req.countries.length > 0) {
                    query.bool.must.push({
                        terms: {
                            'country.value': req.countries,
                        }
                    })
                }
                if ('string' === typeof(req.email_address.value) && req.email_address.value.length > 0) {
                    if (true === req.email_address.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'email.value': req.email_address.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'email.value': req.email_address.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.email_domain.value) && req.email_domain.value.length > 0) {
                    if (true === req.email_domain.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'domain.value': req.email_domain.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'domain.value': req.email_domain.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.phone_number) && req.phone_number.length > 0) {
                    query.bool.must.push({
                        term: {
                            'meta.aff_unique2': req.phone_number,
                        }
                    })
                }
                if ('string' === typeof(req.ip_address) && req.ip_address.length > 0) {
                    query.bool.must.push({
                        term: {
                            'ip.value': req.ip_address,
                        }
                    })
                }
                if ('string' === typeof(req.user_agent.value) && req.user_agent.value.length > 0) {
                    if (true === req.user_agent.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'meta.ua.keyword': req.user_agent.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'meta.ua.keyword': req.user_agent.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.source.value) && req.source.value.length > 0) {
                    if (true === req.source.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'meta.source.keyword': req.source.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'meta.source.keyword': req.source.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.sub.value) && req.sub.value.length > 0) {
                    if (true === req.sub.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'meta.aff_sub.keyword': req.sub.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'meta.aff_sub.keyword': req.sub.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.affiliate.value) && req.affiliate.value.length > 0) {
                    if (true === req.affiliate.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'meta.aff_id': req.affiliate.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'meta.aff_id': req.affiliate.value,
                            }
                        })
                    }
                }
                break;

            case (['subscriptions', 'registrations'].indexOf(params.type) > -1):
                nested = {
                    nested: {
                        path: 'lead_conversions',
                        score_mode: 'avg',
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            'lead_conversions.date': req.date,
                                        }
                                    },
                                    {
                                        term: {
                                            'lead_conversions.type': params.type.substring(0, params.type.length -1),
                                        }
                                    }
                                ],
                            }
                        }
                    }
                };
                if (Array.isArray(req.countries) && req.countries.length > 0) {
                    query.bool.must.push({
                        terms: {
                            'country.value': req.countries,
                        }
                    })
                }
                if ('string' === typeof(req.email_address.value) && req.email_address.value.length > 0) {
                    if (true === req.email_address.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'email.value': req.email_address.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'email.value': req.email_address.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.phone_number) && req.phone_number.length > 0) {
                    query.bool.must.push({
                        term: {
                            'phone.value': req.phone_number,
                        }
                    })
                }
                if ('string' === typeof(req.network.value) && req.network.value.length > 0) {
                    if (isNaN(req.network.value)) {
                        if (true === req.network.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'conversions.network_name.keyword': req.network.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'conversions.network_name.keyword': req.network.value,
                                }
                            })
                        }
                    } else {
                        if (true === req.network.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'conversions.network': req.network.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'conversions.network': req.network.value,
                                }
                            })
                        }
                    }
                }
                if ('string' === typeof(req.funnel.value) && req.funnel.value.length > 0) {
                    if (isNaN(req.funnel.value)) {
                        if (true === req.funnel.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'conversions.funnel_name.keyword': req.funnel.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'conversions.funnel_name.keyword': req.funnel.value,
                                }
                            })
                        }
                    } else {
                        if (true === req.funnel.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'funnel': req.funnel.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'funnel': req.funnel.value,
                                }
                            })
                        }
                    }
                }
                if ('string' === typeof(req.affiliate.value) && req.affiliate.value.length > 0) {
                    if (isNaN(req.affiliate.value)) {
                        if (true === req.affiliate.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'conversions.affiliate_name.keyword': req.affiliate.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'conversions.affiliate_name.keyword': req.affiliate.value,
                                }
                            })
                        }
                    } else {
                        if (true === req.affiliate.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'affiliate': req.affiliate.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'affiliate': req.affiliate.value,
                                }
                            })
                        }
                    }
                }
                if ('string' === typeof(req.tags) && req.tags.length > 0) {
                    let tgs = req.tags.split(',');
                    query.bool.must.push({
                        terms: {
                            'tags': tgs,
                        }
                    })
                }
                query.bool.must.push(nested);
                break;

            case (['ftds', 'upsales'].indexOf(params.type) > -1):
                nested = {
                    nested: {
                        path: 'lead_conversions',
                        score_mode: 'avg',
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            'lead_conversions.date': req.date,
                                        }
                                    },
                                    {
                                        term: {
                                            'lead_conversions.type': ('ftds' === params.type) ? 'ftd' : 'deposit',
                                        }
                                    }
                                ],
                            }
                        }
                    }
                };
                if (Array.isArray(req.countries) && req.countries.length > 0) {
                    query.bool.must.push({
                        terms: {
                            'country.value': req.countries,
                        }
                    })
                }
                if ('string' === typeof(req.email_address.value) && req.email_address.value.length > 0) {
                    if (true === req.email_address.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'email.value': req.email_address.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            wildcard: {
                                'email.value': req.email_address.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.phone_number) && req.phone_number.length > 0) {
                    query.bool.must.push({
                        term: {
                            'phone.value': req.phone_number,
                        }
                    })
                }
                if ('string' === typeof(req.tags) && req.tags.length > 0) {
                    let tgs = req.tags.split(',');
                    query.bool.must.push({
                        terms: {
                            'tags': tgs,
                        }
                    })
                }
                if ('string' === typeof(req.broker.value) && req.broker.value.length > 0) {
                    if (isNaN(req.broker.value)) {
                        if (true === req.broker.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'conversions.broker_name.keyword': req.broker.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'conversions.broker_name.keyword': req.broker.value,
                                }
                            })
                        }
                    } else {
                        if (true === req.broker.exact) {
                            query.bool.must.push({
                                match_phrase: {
                                    'broker': req.broker.value,
                                }
                            })
                        } else {
                            query.bool.must.push({
                                wildcard: {
                                    'broker': req.broker.value,
                                }
                            })
                        }
                    }
                }
                if ('string' === typeof(req.currencies) && req.currencies.length > 0) {
                    let tgs = req.currencies.split(',');
                    query.bool.must.push({
                        terms: {
                            'currency': tgs,
                        }
                    })
                }
                if ((null !== req.amount.gte && !isNaN(req.amount.gte) && req.amount.gte > 0) || (null !== req.amount.lte && !isNaN(req.amount.lte) && req.amount.lte > 0)) {
                    let p = {
                        range: {},
                    }
                    if (null !== req.amount.gte && !isNaN(req.amount.gte) && req.amount.gte > 0) {
                        p.range.gte = req.amount.gte;
                    }
                    if (null !== req.amount.lte && !isNaN(req.amount.lte) && req.amount.lte > 0) {
                        p.range.lte = req.amount.lte;
                    }
                    query.bool.must.push({
                        amount: p,
                    })
                }
                query.bool.must.push(nested);
                break;

            case (['unsubscriptions'].indexOf(params.type) > -1):
                nested = {
                    nested: {
                        path: 'lead_conversions',
                        score_mode: 'avg',
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            'lead_conversions.date': req.date,
                                        }
                                    },
                                    {
                                        term: {
                                            'lead_conversions.type': 'unsubscribe',
                                        }
                                    }
                                ],
                            }
                        }
                    }
                };
                if (Array.isArray(req.countries) && req.countries.length > 0) {
                    query.bool.must.push({
                        terms: {
                            'country.value': req.countries,
                        }
                    })
                }
                if ('string' === typeof(req.email_address.value) && req.email_address.value.length > 0) {
                    if (true === req.email_address.exact) {
                        query.bool.must.push({
                            match_phrase: {
                                'email.value': req.email_address.value,
                            }
                        })
                    } else {
                        query.bool.must.push({
                            term: {
                                'email.value': req.email_address.value,
                            }
                        })
                    }
                }
                if ('string' === typeof(req.phone_number) && req.phone_number.length > 0) {
                    query.bool.must.push({
                        term: {
                            'phone.value': req.phone_number,
                        }
                    })
                }
                if ('string' === typeof(req.tags) && req.tags.length > 0) {
                    let tgs = req.tags.split(',');
                    query.bool.must.push({
                        terms: {
                            'tags': tgs,
                        }
                    })
                }
                query.bool.must.push(nested);
                break;
        }
        return query;
    }
}

module.exports = MarketingReportController
