'use strict'

const Config = use('Config');
const client = use('elasticsearch');
const importer = use('importer');
const { validate, sanitize, sanitizor } = use('Validator');
const moment = require('moment-timezone');
const supressionLists = require('../../Services/supression-lists');
require('newrelic');
const Notifier = use('Notifier');
const Helpers = use('Helpers')

const lastHourOfClicks = (function(){
    const data = [];
    const time = (new Date()).getTime();
    let i;
    for (i = -59; i <= 0; i += 1) {
        data.push({
            x: time + i * 1000 * 60,
            y: 0,
        });
    }
    return data;
}());

let lastMinuteClickCount = 0;

if (typeof(process.send) === undefined || !Helpers.isAceCommand()) {
    setInterval(() => {
        lastMinuteClickCount = 0;
        lastHourOfClicks.shift();
        const time = (new Date()).getTime();
        lastHourOfClicks.push({
            x: time,
            y: lastMinuteClickCount,
        });
    }, 60000);
}

class HasOffersClickController {
    async upload({response, request}) {
        const Helpers = use('Helpers');
        const validationOptions = {
            types: [
                'csv',
            ],
            size: '100mb',
            extnames: ['csv']
        }
        const file = request.file('file', validationOptions)
        await file.move(Helpers.tmpPath('click-reports'), {
            overwrite: true,
        })
        if (file.moved()) {
            this._handleUploadedFile(file);
            return response.api(201);
        } else {
            return response.api(400, null, [file.error()]);
        }
    }

    async _handleUploadedFile(file) {
        const chunkedForEach = use('chunkedForEach');
        /**
         * Start Parsing!
         */
        const fileInfo = file.toJSON();
        const currentPath = `click-reports/${fileInfo.fileName}`;
        const rows = await importer.getSpreadsheetAsSet('csv', 'local', currentPath, ',');
        const promises = [];
        rows.forEach((row) => {
            const promise = importer.makeLeadMapFromMap(row, Config.get('clickreportmapping.column_settings'));
            promises.push(promise);
        });
        const parsed = await Promise.all(promises);
        chunkedForEach(parsed, 5, async({value}) => {
            const map = value;
            const row = await importer.makeElasticsearchLeadMapFromMap(map, Config.get('clickreportmapping'));
            if (row.has('affiliate_unique_1') && null !== row.get('affiliate_unique_1') && row.get('affiliate_unique_1').length > 0 && 'affiliate_unique_1' !== row.get('affiliate_unique_1')) {
                let email = row.get('affiliate_unique_1');
                email = sanitizor.normalizeEmail(email);
                if (email.length > 1) {
                    /**
                     * This click has an associated email address with it
                     */
                    let confidence = 0;
                    const click = new Map();
                    click.set('reviewed', false);
                    click.set('email', {
                        supressed: false,
                        value: email,
                        reason: null,
                    });
                    click.set('domain', {
                        supressed: false,
                        value: this._getDomainFromEmail(email),
                        reason: null,
                    });
                    click.set('ip', {
                        supressed: false,
                        value: row.get('ip'),
                        reason: null,
                    });
                    click.set('ua', {
                        supressed: false,
                        value: row.get('user_agent'),
                        reason: null,
                    });
                    click.set('country', {
                        supressed: false,
                        value: row.get('country_code'),
                        reason: null,
                    });
                    click.set('created_at', moment());
                    click.set('updated_at', moment());
                    const shouldSupressEmailByLeadCountry = await this._shouldSupressEmailByLeadCountry(email, row.get('country_code'));
                    if (shouldSupressEmailByLeadCountry) {
                        const ce = click.get('email');
                        ce.supressed = true;
                        ce.reason = 'Bot Country different from Lead Country';
                        click.set('email', ce);
                        confidence += 10;
                    }
                    const shoutSupressEmailByValidation = await this._shouldSupressEmailByValidation(email);
                    if (shoutSupressEmailByValidation) {
                        const ce = click.get('email');
                        ce.supressed = true;
                        ce.reason = 'Invalid Email Address';
                        click.set('email', ce);
                        confidence += 10;
                    }
                    const shouldSupressEmailByPreviousSupress = await this._shouldSupressEmailByPreviousSupress(email);
                    if (shouldSupressEmailByPreviousSupress) {
                        const ce = click.get('email');
                        ce.supressed = true;
                        ce.reason = 'Previously Supressed Email Address';
                        click.set('email', ce);
                        confidence += 20;
                    }
                    const shouldSupressEmailIfInWarehouse = await this._shouldSupressEmailIfNotInWarehouse(email);
                    if (shouldSupressEmailIfInWarehouse) {
                        const ce = click.get('email');
                        ce.supressed = true;
                        ce.reason = 'Lead does not exist in the database';
                        click.set('email', ce);
                        confidence += 5;
                    }
                    const shouldSupressDomainByPreviousSupress = await this._shouldSupressDomainByPreviousSupress(click.get('domain').value);
                    if (shouldSupressDomainByPreviousSupress) {
                        const ce = click.get('domain');
                        ce.supressed = true;
                        ce.reason = 'Previously Supressed Domain';
                        click.set('domain', ce);
                        confidence += 5;
                    }
                    const shouldSupressUAByPreviousSupress = await this._shouldSupressUAByPreviousSupress(click.get('ua').value);
                    if (shouldSupressUAByPreviousSupress) {
                        const ce = click.get('ua');
                        ce.supressed = true;
                        ce.reason = 'Previously Supressed User Agent';
                        click.set('ua', ce);
                        confidence += 5;
                    }
                    const shouldSupressIPByPreviousSupress = await this._shouldSupressIPByPreviousSupress(click.get('ip').value);
                    if (shouldSupressIPByPreviousSupress) {
                        const ce = click.get('ip');
                        ce.supressed = true;
                        ce.reason = 'Previously Supressed IP Address';
                        click.set('ip', ce);
                        confidence += 10;
                    }
                    if (confidence >= 20) {
                        click.set('reviewed', true);
                    }
                    if (shouldSupressEmailIfInWarehouse) {
                        click.set('reviewed', false);
                    }
                    if (true === click.get('reviewed')) {
                        this.handleReviewedLead(click);
                    }
                    await this._saveClickMapToElasticSearch(click);
                }
            }
        });
    }

    async listReview({response, params}) {
        let body;
        if ('string' !== typeof(params.scroll)) {
            const query = {
                index: 'clicks',
                size: 25,
                _source: true,
                scroll: '1h',
                body: {
                    query: {
                        term: {
                            reviewed: false,
                        }
                    },
                    sort: [
                        {created_at: 'desc'},
                        {updated_at: 'asc'},
                        '_score',
                    ],
                }
            }
            try {
                const response = await client.search(query);
                body = response.body;
            } catch (error) {
                return response.api(500, null, [{message: error.toString()}]);
            }
        } else {
            const query = {
                scroll_id: params.scroll,
                scroll: '1h',
            }
            try {
                const response = await client.scroll(query);
                body = response.body;
            } catch (error) {
                return response.api(500, null, [{message: error.toString()}]);
            }
        }
        const clicks = {};
        body.hits.hits.forEach((click) => {
            clicks[click._id] = click._source;
        });
        return response.api(200, {
            total: body.hits.total.value,
            clicks,
            scroll: body._scroll_id,
        });
    }

    async updateClick({request, response, params}) {
        if ('string' !== typeof(params.id)) {
            return response.api(400, null, [{message: 'Invalid Click ID'}]);
        }
        const update = {
            reviewed: request.input('reviewed'),
            email: request.input('email'),
            domain: request.input('domain'),
            ip: request.input('ip'),
            ua: request.input('ua'),
            updated_at: moment(),
        }
        try {
            const {body} = await client.update({
                index: 'clicks',
                refresh: true,
                retry_on_conflict: 5,
                id: params.id,
                body: {
                    doc: update
                },
            });
            response.api(201, body);
        } catch (error) {
            response.api(error.meta.statusCode, null, [{message: error.toString()}]);
        }
        if (true == request.input('reviewed')) {
            update.country = request.input('country');
            this.handleReviewedLead(update);
        } else {
            const supressionPromises = [];
            supressionPromises.push(this.supressClicksMatching('email', update.email.value, update.email.supressed));
            supressionPromises.push(this.supressClicksMatching('domain', update.domain.value, update.domain.supressed));
            supressionPromises.push(this.supressClicksMatching('ip', update.ip.value, update.ip.supressed));
            supressionPromises.push(this.supressClicksMatching('ua', update.ua.value, update.ua.supressed));
            await Promise.all(supressionPromises);
        }
        // return response.api(503, update, [{message: 'Debug'}]);
    }

    async _saveClickMapToElasticSearch(click) {
        const obj = {};
        click.forEach( (value, key) => {
            obj[key] = value;
        })
        try {
            const {body} = await client.index({
                index: 'clicks',
                refresh: true,
                body: obj,
            });
            console.log(`Saved click with ID ${body._id}`);
            return body;
        } catch (error) {
            console.warn(`Failed to save Click to Elasticsearch due to error: ${error.toString()}`);
            console.warn(error);
        }
    }

    async handleReviewedLead(click) {
        /**
         * If the click is a Map, convert it to an object
         * so we can perform the same code
         */
        if (click instanceof Map) {
            const newclick = {};
            click.forEach((value, key) => {
                newclick[key] = value;
            });
            click = newclick;
        }
        /**
         * Update All Relevant Clicks
         */
        const supressionPromises = [];
        if (click.email.supressed) {
            supressionPromises.push(this.supressClicksMatching('email', click.email.value));
            supressionLists.emails.add('click.email.value');
        }
        if (click.domain.supressed) {
            supressionPromises.push(this.supressClicksMatching('domain', click.domain.value));
            supressionLists.domains.add('click.domain.value');
        }
        if (click.ip.supressed) {
            supressionPromises.push(this.supressClicksMatching('ip', click.ip.value));
        }
        if (click.ua.supressed) {
            supressionPromises.push(this.supressClicksMatching('ua', click.ua.value));
        }
        await Promise.all(supressionPromises);
        /**
         * If there is no lead, create it
         */
        const createLead = await this._shouldSupressEmailIfNotInWarehouse(click.email.value);
        if (createLead) {
            let lead = new Map();
            lead.set('email', {
                valid: true,
                value: click.email.value,
                supressed: click.email.supressed,
            });
            lead.set('ip', click.ip.value);
            lead.set('ua', click.ua.value);
            lead.set('country', importer._formatCell(click.country.value, 'country'));
            lead = importer._removeInvalidFields(lead);
            await importer.saveLeadToElasticsearch(lead);
        }
        /**
         * Add a click conversion
         */
        await importer.captureConversion({
            email: click.email.value
        }, {
            type: 'click',
            date: moment(),
        });
    }

    async supressClicksMatching(field, value, supress) {
        if ('boolean' !== typeof(supress)) {
            supress = true;
        }
        const query = {
            index: 'clicks',
            ignore_unavailable: true,
            allow_no_indices: true,
            conflicts: 'proceed',
            _source: true,
            refresh: true,
            body: {
                query: {
                    bool: {
                        must: [
                        ]
                    }
                },
                script: {
                    source: `ctx._source.${field}.supressed = true; ctx._source.${field}.reason =  'Manual Review'; ctx._source.reviewed = true;`,
                    lang: 'painless',
                }
            }
        }
        const valuePart = {match_phrase: {}}
        valuePart.match_phrase[`${field}.value`] = value;
        const boolPart = {term: {}}
        boolPart.term[`${field}.supressed`] = supress;
        query.body.query.bool.must.push(valuePart);
        query.body.query.bool.must.push(boolPart);
        try {
            await client.updateByQuery(query);
        } catch (error) {
            console.warn(`Unable to update clicks matching ${field}=${value} due to error: ${error.toString()}`);
            console.warn(error.meta.body.error);
            console.warn(error);
        }
    }

    async generateClick({request, response}) {
        const rules = {
            email: 'email',
            phone: 'string',
            offer: 'integer',
            affiliate: 'integer',
            tags: 'string',
            ip: 'required|ip',
            country: 'required|country',
            ua: 'required|string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            email: 'normalize_email',
            phone: 'phoneNumber',
            offer: 'to_int',
            affiliate: 'to_int',
            tags: 'escape',
            ip: 'escape',
            country: 'escape',
            ua: 'escape',
        });
        let confidence = 0;
        const click = new Map();
        click.set('reviewed', false);
        if (req.email) {
            click.set('email', {
                supressed: false,
                value: req.email,
                reason: null,
            });
            click.set('domain', {
                supressed: false,
                value: this._getDomainFromEmail(req.email),
                reason: null,
            });
        } else {
            click.set('email', {
                supressed: false,
                value: null,
                reason: null,
            });
            click.set('domain', {
                supressed: false,
                value: null,
                reason: null,
            });
        }
        if (req.phone) {
            click.set('phone', {
                supressed: false,
                value: req.phone,
                reason: null,
            });
        }
        click.set('ip', {
            supressed: false,
            value: req.ip,
            reason: null,
        });
        click.set('ua', {
            supressed: false,
            value: req.ua,
            reason: null,
        });
        click.set('country', {
            supressed: false,
            value: req.country,
            reason: null,
        });
        if ('object' === typeof(req.meta) && null !== req.meta && Object.keys(req.meta).length > 0) {
            click.set('meta', req.meta);
        }
        click.set('created_at', moment());
        click.set('updated_at', moment());
        const body = await this._saveClickMapToElasticSearch(click);
        if (!body) {
            return response.api(500, null, [{message: 'An unknown error occured. Please try again.'}]);
        } else {
            Notifier.emit('click-generated', body._id);
            lastHourOfClicks[lastHourOfClicks.length - 1].y ++;
            return response.api(201, body._id);
        }
    }

    async internalClickSearch({request, response}) {
        const rules = {
            click_id: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            click_id: 'escape',
        });
        try {
            const {body} = await client.get({
                index: 'clicks',
                id: req.click_id
            });
            return response.api(200, body._source);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async getLastHourOfClicks({response}) {
        return response.api(200, lastHourOfClicks);
    }

    _getDomainFromEmail(email) {
        let ret = null;
        if ('string' === typeof(email) && email.includes('@')) {
            const parts = email.split('@');
            ret = parts[1];
        }
        return ret;
    }

    /**
     * Check if the provided email is associated with a lead.
     * If it isn't, potentially supress the email
     */
    async _shouldSupressEmailIfNotInWarehouse(email) {
        let ret = true;
        const query = {
            index: 'leads',
            size: 1,
            body: {
                query: {
                    match_phrase: {
                        'email.value': email,
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                ret = false;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    /**
     * Check if the provided email is associated with a lead
     * if it is, compare countries
     * if the click country <> the lead country, and if the country is in the list of bot countries,
     * supress email
     */
    async _shouldSupressEmailByLeadCountry(email, country) {
        let ret = false;
        let changed = false;
        const botCountries = Config.get('supression.botcountries');
        if (botCountries.indexOf(country) === -1) {
            return ret;
        }
        const query = {
            index: 'leads',
            size: 1,
            body: {
                query: {
                    match_phrase: {
                        'email.value': email,
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                for (let i = 0; i < body.hits.hits.length; i++) {
                    const hit = body.hits.hits[i];
                    const source = hit._source;
                    if ('object' === typeof(source.country)) {
                        if (!ret && !changed && source.country.value !== country) {
                            ret = true;
                            changed = true;
                        }
                        if (ret && source.country.value === country) {
                            ret = false;
                            changed = true;
                        }
                    }
                }
            } else {
                ret = true;
                changed = true;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    /**
     * Check if the provided email is valid
     * if it isn't, supress the email
     */
    async _shouldSupressEmailByValidation(email) {
        const ret = {
            valid: await importer._valid('email', email),
            value: sanitizor.normalizeEmail(email),
        }
        return (!ret.valid || ret.value == '@');
    }

    /**
     * Check if email is already supressed
     * if it is, supress it again!
     */
    async _shouldSupressEmailByPreviousSupress(email) {
        let ret = false;
        const query = {
            index: 'clicks',
            size: 1,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match_phrase: {
                                    'email.value': email,
                                }
                            },
                            {
                                term: {
                                    'email.supressed': true,
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                ret = true;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    /**
     * Check if domain is already supressed
     * if it is, supress it again!
     */
    async _shouldSupressDomainByPreviousSupress(domain) {
        let ret = false;
        const query = {
            index: 'clicks',
            size: 1,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match_phrase: {
                                    'domain.value': domain,
                                }
                            },
                            {
                                term: {
                                    'domain.supressed': true,
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                ret = true;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    /**
     * Check if user agent is already supressed
     * if it is, supress it again!
     */
    async _shouldSupressUAByPreviousSupress(ua) {
        let ret = false;
        const query = {
            index: 'clicks',
            size: 1,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match_phrase: {
                                    'ua.value': ua,
                                }
                            },
                            {
                                term: {
                                    'ua.supressed': true,
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                ret = true;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }

    /**
     * Check if ip address is already supressed
     * if it is, supress it again!
     */
    async _shouldSupressIPByPreviousSupress(ip) {
        let ret = false;
        const query = {
            index: 'clicks',
            size: 1,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match_phrase: {
                                    'ip.value': ip,
                                }
                            },
                            {
                                term: {
                                    'ip.supressed': true,
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                    '_score',
                ],
            }
        }
        try {
            const { body } = await client.search(query);
            if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                ret = true;
            }
        } catch (error) {
            console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
            console.warn(error);
        }
        return ret;
    }
}

module.exports = HasOffersClickController
