'use strict'

require('newrelic');
const moment = require('moment-timezone');

class DashboardController {
    async getTags({response}) {
        const {client} = require('../../Services/elasticsearch');
        try {
            const query = {
                index: 'leads',
                body: {
                    query: {
                        exists: {
                            field: 'tags',
                        }
                    },
                    size: 0,
                    aggs: {
                        top_tags: {
                            terms: {
                                field: 'tags.keyword',
                                size: 10,
                            }
                        }
                    }
                }
            }
            const result = await client.search(query);
            const serieses = [];
            for (let i = 0; i < result.body.aggregations.top_tags.buckets.length; i++) {
                const bucket = result.body.aggregations.top_tags.buckets[i];
                serieses.push({
                    type: 'column',
                    name: bucket.key,
                    data: [bucket.doc_count],
                });
            }
            return response.api(200, serieses);
        } catch (error) {
            console.warn(JSON.stringify(error, null, 2));
            return response.api(500, null, [{message: error.toString()}]);
        }

        return response.api(503, null, [{message: "Debug"}]);
    }

    async getCountries({request, response}) {
        const {client} = require('../../Services/elasticsearch');
        try {
            const query = {
                index: 'leads',
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        'country.valid': true,
                                    }
                                }
                            ],
                        }
                    },
                    size: 0,
                    aggs: {
                        top_countries: {
                            terms: {
                                field: 'country.value',
                                size: 300,
                            }
                        }
                    }
                }
            }
            switch(request.input('filter')) {
                case 'emails':
                    query.body.query.bool.must.push({
                        match: {
                            'email.valid': true,
                        }
                    });
                    break;

                    case 'all-phones':
                    query.body.query.bool.must.push({
                        match: {
                            'phone.valid': true,
                        }
                    });
                    break;

                case 'mobile-phones':
                    query.body.query.bool.must.push({
                        match: {
                            'phone.is_mobile': true,
                        }
                    });
                    query.body.query.bool.must.push({
                        match: {
                            'phone.is_landline': false,
                        }
                    });
                    break;

                case 'landline-phones':
                    query.body.query.bool.must.push({
                        match: {
                            'phone.is_landline': true,
                        }
                    });
                    query.body.query.bool.must.push({
                        match: {
                            'phone.is_mobile': false,
                        }
                    });
                    break;
            }
            const result = await client.search(query);
            const data = [];
            for (let i = 0; i < result.body.aggregations.top_countries.buckets.length; i++) {
                const bucket = result.body.aggregations.top_countries.buckets[i];
                data.push({
                    key: bucket.key.toLowerCase(),
                    value: bucket.doc_count
                });
            }
            const serieses = [{
                data,
                keys: ['hc-key', 'value'],
                joinBy: ['hc-key', 'key'],
                name: 'Leads',
            }];
            return response.api(200, serieses);
        } catch (error) {
            console.warn(JSON.stringify(error, null, 2));
            return response.api(500, null, [{message: error.toString()}]);
        }

        return response.api(503, null, [{message: "Debug"}]);
    }

    async marketingGetDaily({request, response}) {
        const serieses = [];
        let start = moment(request.input('start'));
        let end = moment(request.input('end'));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                match_all: {}
            }
        }, 'Clicks', '#42A5F5', start, end, 'clicks'));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                term: {
                    'lead_conversions.type': 'subscription',
                }
            }
        }, 'Subscriptions', '#26A69A', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                term: {
                    'lead_conversions.type': 'registration',
                }
            }
        }, 'Registrations', '#17a2b8', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                term: {
                    'lead_conversions.type': 'unsubscribe',
                }
            }
        }, 'Unsubscribes', '#F44336', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'lead_conversions.type': 'call',
                            }
                        }
                    ],
                    must_not: [
                        {
                            terms: {
                                'lead_conversions.disposition.keyword': ["A", "AA", "AB", "ADC", "ADCT", "AFAX", "AL", "AM", "B", "N", "NA", "NANQUE", "PM"],
                            }
                        }
                    ]
                }
            }
        }, 'Unanswered Calls', '#fd7e14', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'lead_conversions.type': 'call',
                            }
                        },
                        {
                            terms: {
                                'lead_conversions.disposition.keyword': ['CALLBK', 'CBHOLD', 'CLAGAN', 'DEC', 'DROP', 'ERI', 'INCALL', 'IVRXFR', 'LB', 'LRERR', 'LSMERG', 'MAXCAL', 'MLINAT', 'NI', 'NP', 'PDROP', 'QCFAIL', 'QVMAIL', 'RQXFER', 'SALE', 'TIMEOT', 'XDROP', 'XFER'],
                            }
                        }
                    ]
                }
            }
        }, 'Answered Calls', '#4CAF50', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                term: {
                    'lead_conversions.type': 'ftd',
                }
            }
        }, 'FTDs', '#66BB6A', start, end));
        serieses.push(this._getTimeSeriesForFilter({
            query: {
                term: {
                    'lead_conversions.type': 'deposit',
                }
            }
        }, 'Upsales', '#2E7D32', start, end));
        const results = await Promise.all(serieses);
        return response.api(200, results);
    }

    async _getTimeSeriesForFilter(filter, name, color, start, end, index) {
        if (!index) {
            index = 'leads';
        }
        let diff = end.diff(start, 'days');
        if (diff < 0) {
            diff = diff * -1;
        }
        const interval = (diff < 2) ? 'hour' : 'day';
        const client = use('elasticsearch');
        const ret = {
            name,
            data: [],
            color,
        }
        const query = {
            index,
            size: 0,
            body: {
                query: {
                    bool: {
                        must: [
                            filter.query,
                            {
                                range: {
                                    'lead_conversions.date': {
                                        gte: start,
                                        lte: end,
                                    }
                                }
                            }
                        ]
                    }
                },
                aggs: {
                    conversion_histogram: {
                        date_histogram: {
                            field: 'conversions.date',
                            interval,
                            min_doc_count: 1,
                            missing: 0,
                        }
                    }
                }
            }
        }
        if ('clicks' === index) {
            query.body.query.bool.must[1].range = {
                created_at: {
                    gte: start,
                    lte: end,
                }
            }
            query.body.aggs.conversion_histogram.date_histogram.field = 'created_at';
        } else {
            query.body.query = {
                nested: {
                    path: 'lead_conversions',
                    score_mode: 'avg',
                    query: query.body.query,
                }
            }
        }
        // console.log(JSON.stringify(query.body));
        try {
            const {body} = await client.search(query);
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
                ret.data.push([m.valueOf(), count]);
            }
        } catch (error) {
            console.warn(`Failed to create histogram due to error: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    async marketingGetByCountry({request, response}) {
        const serieses = [];
        const start = request.input('start', moment().subtract(29, 'days').format());
        const end = request.input('end', moment().format());
        return response.api(200, serieses);
    }

    async getTotalsForKeys({request, response}) {
        let start = moment(request.input('start'));
        let end = moment(request.input('end'));
        const keys = request.input('keys');
        const promises = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            promises.push(this._getTotalForKey(start, end, key));
        }
        const results = await Promise.all(promises);
        let ret = {};
        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            ret = {...ret, ...res};
        }
        return response.api(200, ret);
    }

    async _getTotalForKey(start, end, key) {
        const client = use('elasticsearch');
        const ret = {};
        let total = 0;
        const query = {
            index: ('clicks' === key) ? 'clicks' : 'leads',
            // size: 1,
            body: {
                query: {
                    bool: {
                        must: [],
                    }
                }
            }
        }
        if ('clicks' === key) {
            query.body.query.bool.must.push({
                range: {
                    created_at: {
                        gte: start,
                        lte: end,
                    }
                }
            });
        } else {
            query.body.query.bool.must.push({
                range: {
                    'lead_conversions.date': {
                        gte: start,
                        lte: end,
                    }
                }
            });
            switch(key) {
                case 'calls':
                    query.body.query.bool.must.push({
                        term: {
                            'lead_conversions.type': 'call',
                        }
                    });
                    query.body.query.bool.must.push({
                        terms: {
                            'lead_conversions.disposition.keyword': ["A", "AA", "AB", "ADC", "ADCT", "AFAX", "AL", "AM", "B", "N", "NA", "NANQUE", "PM"],
                        }
                    });
                    break;

                case 'answeredCalls':
                    query.body.query.bool.must.push({
                        term: {
                            'lead_conversions.type': 'call',
                        }
                    });
                    query.body.query.bool.must.push({
                        terms: {
                            'lead_conversions.disposition.keyword': ['CALLBK', 'CBHOLD', 'CLAGAN', 'DEC', 'DROP', 'ERI', 'INCALL', 'IVRXFR', 'LB', 'LRERR', 'LSMERG', 'MAXCAL', 'MLINAT', 'NI', 'NP', 'PDROP', 'QCFAIL', 'QVMAIL', 'RQXFER', 'SALE', 'TIMEOT', 'XDROP', 'XFER'],
                        }
                    });
                    break;

                default:
                    query.body.query.bool.must.push({
                        term: {
                            'lead_conversions.type': key.substring(0, key.length - 1),
                        }
                    });
                    break;
            }
        }
        // console.log(JSON.stringify(query.body));
        let rq;
        if ('clicks' === key) {
            rq = query;
        }
        else {
            rq = {
                index: 'leads',
                body: {
                    query: {
                        nested: {
                            path: 'lead_conversions',
                            score_mode: 'avg',
                            query: query.body.query,
                        }
                    }
                }
            }
        }
        // console.log(JSON.stringify(rq.body));
        try {
            const {body} = await client.count(rq);
            total = body.count;
        } catch (error) {
            console.warn(`Failed to get count for key ${key} to error: ${error.toString()}`);
            console.warn(error);
        }
        ret[key] = total;
        return ret;
    }
}

module.exports = DashboardController
