'use strict'

const { validate, sanitizor } = use('Validator');
const client = use('elasticsearch');
const moment = require('moment-timezone');
const Redis = use('Redis');
const newrelic = require('newrelic');

class LeadImporter {
    async getSpreadsheetAsSet(type, drive, path, delimiter, limit) {
        const Drive = use('Drive');
        const file = await Drive.disk(drive).get(path);
        switch(type) {
            case 'csv':
                if ([',', ';'].indexOf(delimiter) === -1) {
                    return await this.getCSVXSpreadsheetAsSet(file, delimiter, limit);
                } else {
                    return await this.getXLSXSpreadsheetAsSet(file, limit);    
                }

            case 'excel':
                return await this.getXLSXSpreadsheetAsSet(file, limit);

            default:
                console.log(`Unknown file type: ${type}`);
                return new Set();
        }
    }

    async getSpreadsheetAsStream(path, delimiter, from_line, to_line) {
        if (isNaN(from_line)) {
            from_line = 0;
        }
        from_line ++;
        const fs = require('fs'); 
        const csv = require('csv-parse');
        const Helpers = use('Helpers');
        const file = Helpers.tmpPath(path);
        return fs.createReadStream(file).pipe(csv({
            delimiter,
            from_line,
            to_line,
            ltrim: true,
            rtrim: true,
            skip_lines_with_error: true,
            skip_empty_lines: true,
        }));
    }

    fileNeedsToBeStreamed(path) {
        // return true;
        const fs = require('fs');
        const Helpers = use('Helpers');
        const file = Helpers.tmpPath(path);
        const {size} = fs.statSync(file);
        return (size > 500);
    }

    async getCSVXSpreadsheetAsSet(file, delimiter, limit) {
        const CSVX = require("csv-parse/lib/sync");
        const results = new Set();
        const output = CSVX(file, {
            delimiter,
            skip_lines_with_error: true,
        });
        output.slice(0, limit).forEach((row) => {
            const r = new Map();
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                r.set(i, cell);
            }
            results.add(r);
        });
        return results;
    }

    async getXLSXSpreadsheetAsSet(file, limit) {
        const XLSX = require('xlsx');
        const results = new Set();
        const workbook = XLSX.read(file, {
            type:"buffer",
            sheetRows: limit
        });
        const sheetsList = workbook.SheetNames;
        const output = await XLSX.utils.sheet_to_json(workbook.Sheets[sheetsList[0]], {
            raw: true,
            defval: '',
            blankrows: false,
            header: 1,
        });
        output.forEach( (row) => {
            const r = new Map();
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                r.set(i, cell);
                results.add(r);
            }
        });
        return results;
    }

    async makeLeadMapFromMap(map, settings) {
        const ret = new Map();
        for (let cid in settings) {
            const column = settings[cid];
            const id = parseInt(cid);
            if (!map.has(id)) {
                ret.set(id, await this._formatCell(column.options.default, column.type, column));
            } else {
                ret.set(id, await this._formatCell(map.get(id), column.type, column));
            }
        }
        const formatted = await this._formatLeadMap(ret, settings);
        return formatted;
    }

    async makeLeadObjectFromMap(map, settings) {
        const leadMap = await this.makeLeadMapFromMap(map, settings);
        const obj = {};
        leadMap.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }

    async makeElasticsearchLeadMapFromMap(map, {column_settings, tags, conversion_settings}) {
        const ret = new Map();
        for (let cid in column_settings) {
            const column = column_settings[cid];
            const id = parseInt(cid);
            const value = map.get(id);
            if ('string' === typeof(column.name) && column.name.length > 0) {
                const name = column.name;
                switch (typeof(value)) {
                    case 'undefined':   // nothing to do with an undefined type
                        break;

                    case 'function':    // nothing to do with a function for now. Maybe later?
                        break;

                    case 'string':
                        if (!ret.has(name) || null === ret.get(name)) {
                            ret.set(name, value);
                        }
                        break;

                    case 'number':
                        if (!ret.has(name) || null === ret.get(name)) {
                            ret.set(name, value);
                        }
                        break;

                    case 'boolean':
                        if (!ret.has(name) || null === ret.get(name)) {
                            ret.set(name, value);
                        }
                        break;

                    case 'object':
                        if (null === value) {
                            if (!ret.has(name) || null === ret.get(name)) {
                                ret.set(name, value);
                            }
                        }
                        if (['fullname', 'leadpagesphone'].indexOf(column.type) >= 0
                            && 'undefined' !== typeof(value.valid)
                            && value.valid) {
                            if (name.match(/\{([^\}]+)\}/g) !== null) {
                                const matches = name.match(/\{([^\}]+)\}/);
                                const match = matches[1];
                                const parts = match.split(',');
                                for (let i = 0; i < parts.length; i++) {
                                    const part = parts[i].trim();
                                    if ('undefined' !== typeof(value[part]) && null !== value[part] && (!ret.has(part) || null === ret.get(part))) {
                                        ret.set(part, value[part]);
                                    }
                                    else if (part.includes(':')) {
                                        const kvs = part.split(':');
                                        const key = kvs[0].trim();
                                        const valkey = kvs[1].trim();
                                        if ('undefined' !== typeof(value[valkey]) && null !== value[valkey] && (!ret.has(key) || null === ret.get(key))) {
                                            ret.set(key, value[valkey]);
                                        }
                                    }
                                }
                            } else {
                                // do nothing, since we don't actually know how to map this field.
                            }
                        }
                        if (['email', 'phone', 'country'].indexOf(column.type) >= 0 && value.valid
                            && (!ret.has(name) || null === ret.get(name) || false === ret.get(name).valid)
                        ) {
                            ret.set(name, value);
                        }
                        break;
                }
            }
        }
        if (ret.has('ip') && (null === ret.get('ip') || '' === ret.get('ip'))) {
            ret.delete('ip');
        }
        const ltags = [];
        if ('undefined' !== typeof(tags) && null !== tags) {
            tags.split(',').forEach( (tag) => {
                ltags.push(tag);
            });
        }
        ret.set('tags', ltags);
        if ('object' === typeof(conversion_settings) && null !== conversion_settings) {
            const conversions = [];
            const conversionTypes = ['click', 'subscription', 'registration', 'call', 'ftd', 'upsale'];
            for (let i = 0; i < conversionTypes.length; i++) {
                const type = conversionTypes[i];
                if (conversion_settings[type].has !== 'false' && conversion_settings[type].has !== null) {
                    const conversion = {
                        type: (type === 'upsale') ? 'deposit' : type,
                    };
                    for (let key in conversion_settings[type]) {
                        if (key !== 'has') {
                            const column = `${conversion_settings[type][key].mapping}`;
                            let val;
                            switch(column) {
                                case '-1':
                                    val = conversion_settings[type][key].default;
                                    break;

                                case '':
                                    break;

                                default:
                                    val = map.get(parseInt(column));
                                    if (null === val) {
                                        val = conversion_settings[type][key].default;
                                    }
                                    break;
                            }
                            if ('date' === key) {
                                val = (moment(val).isValid()) ? moment(val) : null;
                                conversion[key] = val;
                            }
                            else if ('amount' === key) {
                                if (isNaN(val)) {
                                    val = null;
                                } else {
                                    val = parseFloat(val);
                                }
                                conversion[`${key}`] = val;
                            }
                            else if ('currency' === key || 'disposition' === key) {
                                conversion[`${key}`] = val;
                            }
                            else if ('undefined' !== typeof(val) && val !== null) {
                                if (!isNaN(val)) {
                                    conversion[`${key}`] = val;
                                } else {
                                    conversion[`${key}_name`] = val;
                                }
                            }
                        }
                    }
                    if (Object.keys(conversion).length > 0) {
                        conversions.push(conversion);
                    }
                }
            }
            ret.set('conversions', conversions);
        }
        return ret;
    }

    async makeElasticsearchLeadObjectFromMap(map, settings) {
        const leadMap = await this.makeElasticsearchLeadMapFromMap(map, settings);
        const obj = {};
        leadMap.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }

    async applyPostProcessingFixesToLeadMap(map, settings) {
        /**
         * Fixes to apply
         * 1. If there is no country, but there is an IP, set the lead country from the IP
         * 2. If there is no country, or there is a country which doesn't match the definitive valid phone number's country, set the lead country to match the phone
         * 3. If the phone number is not valid and the country is different than the phone, check if the phone is valid if the country, and if so, set it
         * 4. If there is a broker, add it to an array of brokers
         * 5. Unset any invalid information
         */
        const typeMap = new Map();
        // Generate the Type Map based on the column settings
        for (let cid in settings) {
            const column = settings[cid];
            if ('string' === typeof(column.name) && column.name.length > 0) {
                const name = column.name;
                if (['fullname', 'leadpagesphone'].indexOf(column.type) >= 0) {
                    if (name.match(/\{([^\}]+)\}/g) !== null) {
                        const matches = name.match(/\{([^\}]+)\}/);
                        const match = matches[1];
                        const parts = match.split(',');
                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i].trim();
                            if ('fullname' === column.type) {
                                if (part.includes(':')) {
                                    const kvs = part.split(':');
                                    const key = kvs[0].trim();
                                    typeMap.set(key, 'name');
                                } else {
                                    typeMap.set(part, 'name');
                                }
                            }
                            if ('leadpagesphone' === column.type ) {
                                const t = (0 === i) ? 'country' : 'phone';
                                if (part.includes(':')) {
                                    const kvs = part.split(':');
                                    const key = kvs[0].trim();
                                    typeMap.set(key, t);
                                } else {
                                    typeMap.set(part, t);
                                }
                            }
                        }
                    } else {
                        typeMap.set(name, column.type);
                    }
                }
                else {
                    typeMap.set(name, column.type);
                }
            }
        }
        try {
            // Handle #1
            map = await this._addCountryIfMissingByIp(map, typeMap);
            // Handle #2
            map = this._addCountryIfMissingByPhone(map, typeMap);
            // Handle #3
            map = this._fixPhoneAccordingToCountry(map, typeMap);
            // Handle #4
            map = this._addBrokerToBrokersArray(map);
            // Handle #5
            map = this._removeInvalidFields(map);
        } catch (error) {
            console.warn(`Failed to apply Post Processing Fixes to Lead Map due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
        }
        return map;
    }

    async getExistingLeadId(map) {
        /**
         * Redis does not seem to be working well, so we are going to use native ElasticSearch queries
         */
        const sleep = use('sleep');
        let emailId;
        let phoneId;
        let email;
        let phone;
        const promises = [];
        if (map.has('email')) {
            email = map.get('email').value;
            promises.push(this.getDuplicateId('email', email, true));
        }
        if (map.has('phone')) {
            phone = map.get('phone').value;
            promises.push(this.getDuplicateId('phone', phone, true));
        }
        const results = await Promise.all(promises);
        results.forEach( (obj) => {
            if ('string' === typeof(obj.email)) {
                emailId = obj.email;
            }
            if ('string' === typeof(obj.phone)) {
                phoneId = obj.phone;
            }
        });
        if ('string' === typeof(emailId) && 'string' === typeof(phoneId)) {
            if (emailId === phoneId) {
                return emailId;
            }
            else {
                return {
                    email: emailId,
                    phone: phoneId,
                }
            }
        }
        else if ('string' === typeof(emailId) && 'string' !== typeof(phoneId)) {
            return emailId;
        }
        else if ('string' !== typeof(emailId) && 'string' === typeof(phoneId)) {
            return phoneId;
        }
        return false;
    }

    async mergeLeadDetails(lead, id) {
        try {
            const {body} = await client.get({
                id,
                index: 'leads',
                realtime: true,
                _source: true,
            });
            const eslead = body._source;
            const newLead = new Map();
            for (let key in eslead) {
                if (lead.has(key)) {
                    switch(key) {
                        case 'files':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key], lead.get(key)]));
                            break;

                        case 'tags':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key], lead.get(key)]));
                            break;

                        case 'brokers':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key], lead.get(key)]));
                            break;

                        case 'conversions':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key], lead.get(key)]));
                            break;

                        case 'phone':
                            newLead.set(key, this._getBestOptionForField(key, lead, eslead));
                            break;

                        case 'email':
                            newLead.set(key, this._getBestOptionForField(key, lead, eslead));
                            break;

                        case 'country':
                            newLead.set(key, this._getBestOptionForField(key, lead, eslead));
                            break;

                        case 'geoip':
                            newLead.set(key, this._getBestOptionForField(key, lead, eslead));
                            break;

                        default:
                            newLead.set(key, lead.get(key));
                            break;
                    }
                } else {
                    switch(key) {
                        case 'files':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key]]));
                            break;

                        case 'tags':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key]]));
                            break;

                        case 'brokers':
                            newLead.set(key, this._getCombinedAndUniqueArray([eslead[key]]));
                            break;

                        case 'conversions':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'phone':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'email':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'country':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'geoip':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'created_at':
                            newLead.set(key, eslead[key]);
                            break;

                        case 'updated_at':
                            break;

                        default:
                            newLead.set(key, eslead[key]);
                            break;
                    }
                }
            }
            lead.forEach((value, key) => {
                if (!newLead.has(key)) {
                    switch(key) {
                        case 'files':
                            newLead.set(key, this._getCombinedAndUniqueArray(value));
                            break;
    
                        case 'tags':
                            newLead.set(key, this._getCombinedAndUniqueArray(value));
                            break;
    
                        case 'brokers':
                            newLead.set(key, this._getCombinedAndUniqueArray(value));
                            break;
    
                        case 'conversions':
                            newLead.set(key, value);
                            break;
    
                        case 'phone':
                            newLead.set(key, value);
                            break;
    
                        case 'email':
                            newLead.set(key, value);
                            break;
    
                        case 'country':
                            newLead.set(key, value);
                            break;
    
                        case 'geoip':
                            newLead.set(key, value);
                            break;
    
                        case 'created_at':
                            newLead.set(key, value);
                            break;
    
                        case 'updated_at':
                            break;
    
                        default:
                            newLead.set(key, value);
                            break;
                    }
                }
            })
            lead = newLead;
        } catch (error) {
            console.warn(`Error Merging Lead Details: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
        }
        return lead;
    }

    async getDuplicateId(field, value, promised, full, iteration) {
        let hasDuplicate;
        if ('number' !== typeof(iteration)) {
            iteration = 0;
        } else {
            iteration ++;
        }
        try {
            hasDuplicate = await Redis.get(value);
        } catch (error) {
            console.warn(`Error getting key ${value} from Redis`);
            console.warn(error);
            newrelic.noticeError(error);
        }
        let ret;
        let source;
        if (hasDuplicate) {
            const query = {
                index: 'leads',
                size: 1,
                body: {
                    query: {},
                    sort: [
                        {created_at: 'asc'},
                        {updated_at: 'desc'},
                        '_score',
                    ],
                }
            }
            switch(field) {
                case 'email':
                    query.body.query = {
                        match_phrase: {
                            'email.value': value,
                        }
                    }
                    break;
    
                case 'phone':
                    query.body.query = {
                        term: {
                            'phone.value': value,
                        }
                    }
                    break;
            }
            try {
                const { body } = await client.search(query);
                if (body.hits.total.value > 0 && Array.isArray(body.hits.hits)) {
                    for (let i = 0; i < body.hits.hits.length; i++) {
                        const hit = body.hits.hits[i];
                        source = hit._source;
                        source._id = hit._id;
                        if ('object' === typeof(source[field]) && null !== source[field] && source[field].value === value) {
                            ret = hit._id;
                            break;
                        }
                    }
                } else if (iteration < 25) {
                    const sleep = use('sleep');
                    await sleep(100);
                    return this.getDuplicateId(field, value, promised, full, iteration);
                }
            } catch (error) {
                console.warn(`Error running search query ${JSON.stringify(query)}: ${error.toString()}`);
                console.warn(error);
                newrelic.noticeError(error);
            }
        }
        if (full) {
            return source;
        }
        else if (promised) {
            const obj = {};
            obj[field] = ret;
            return obj;
        } else {
            return ret;
        }
    }

    async setDuplicateId(field, value, id) {
        // const key = `lead_${field}_${value}`;
        try {
            const ret = await Redis.set(value, true);
            // console.info(`Saving value ${id} to key ${key} resulted in ${ret}`);
            return ret;
        } catch (error) {
            console.warn(`Error setting key ${value} from Redis`);
            console.warn(error);
            newrelic.noticeError(error);
            return false;
        }
    }

    async enqueueLeadToElasticsearch(lead, saveId, deleteId) {
        const esqueue = use('esqueue');
        /**
         * Change `conversions` to `lead_conversions` which is a nested object
         */
        if (lead.has('conversions')) {
            lead.set('lead_conversions', lead.get('conversions'));
        }
        if (!lead.has('created_at')) {
            lead.set('created_at', moment());
        }
        lead.set('updated_at', moment());
        const obj = {};
        lead.forEach((value, key) => {
            obj[key] = value;
        });
        const ret = {
            status: true,
            feedback: null,
            final: null,
            error: null,
            original: obj,
            id: '',
            dd: null,
            is_new: !(saveId),
        }
        if (saveId) {
            /**
             * Replace this with a function which pushes the update to the queue
             */
            esqueue.addUpdate(lead, saveId);
        }
        else {
            /**
             * Replace this with a function which pushes the insert to the queue
             */
            esqueue.addInsert(lead);
        }
        if (ret.status === true) {
            if (lead.has('email')) {
                const email = lead.get('email');
                if ('object' === typeof(email) && null !== email) {
                    await this.setDuplicateId('email', email.value, ret.id);
                }
            }
            if (lead.has('phone')) {
                const phone = lead.get('phone');
                if ('object' === typeof(phone) && null !== phone) {
                    await this.setDuplicateId('phone', phone.value, ret.id);
                }
            }
        }
        return ret;
    }

    async saveLeadToElasticsearch(lead, saveId, deleteId) {
        /**
         * Change `conversions` to `lead_conversions` which is a nested object
         */
        if (lead.has('conversions')) {
            lead.set('lead_conversions', lead.get('conversions'));
        }
        if (!lead.has('created_at')) {
            lead.set('created_at', moment());
        }
        lead.set('updated_at', moment());
        const obj = {};
        lead.forEach((value, key) => {
            obj[key] = value;
        });
        const ret = {
            status: null,
            feedback: null,
            final: null,
            error: null,
            original: obj,
            id: null,
            dd: null,
            is_new: !(saveId),
        }
        if (saveId) {
            try {
                /**
                 * Replace this with a function which pushes the update to the queue
                 */
                const {body} = await client.update({
                    index: 'leads',
                    refresh: true,
                    retry_on_conflict: 5,
                    id: saveId,
                    body: {
                        doc: obj
                    },
                });
                ret.status = true;
                ret.feedback = body;
                ret.id = body._id;
            } catch (error) {
                if ('object' === typeof(error.meta) && 404 === error.meta.statusCode) {
                    return await this.saveLeadToElasticsearch(lead);
                }
                ret.status = false;
                ret.error = error;
                console.warn(`Error saving lead to elasticsearch: ${error.toString()}`);
                console.warn(error.meta.body.error);
                newrelic.noticeError(error);
            }
        }
        else {
            try {
                /**
                 * Replace this with a function which pushes the update to the queue
                 */
                const {body} = await client.index({
                    index: 'leads',
                    refresh: true,
                    body: obj,
                });
                ret.status = true;
                ret.feedback = body;
                ret.id = body._id;
            } catch (error) {
                ret.status = false;
                ret.error = error;
                console.warn(`Error saving lead to elasticsearch: ${error.toString()}`);
                console.warn(error.meta.body.error);
                newrelic.noticeError(error);
            }

        }
        if (ret.id) {
            try {
                const {body} = await client.get({
                    id: ret.id,
                    index: 'leads',
                    realtime: true,
                    _source: true,
                });
                ret.final = body._source;
            } catch (error) {
                console.warn(`Unable to retrieve saved lead details for lead ${ret.id}: ${error.toString()}`);
                console.warn(error.meta.body.error);
                newrelic.noticeError(error);
            }
        }
        if (ret.status === true) {
            if (lead.has('email')) {
                const email = lead.get('email');
                if ('object' === typeof(email) && null !== email) {
                    await this.setDuplicateId('email', email.value, ret.id);
                }
            }
            if (lead.has('phone')) {
                const phone = lead.get('phone');
                if ('object' === typeof(phone) && null !== phone) {
                    await this.setDuplicateId('phone', phone.value, ret.id);
                }
            }
        }
        return ret;
    }

    async captureConversion({email, phone}, conversion, tags) {
        const searchQuery = {
            index: 'leads',
            body: {},
            size: 1,
        };
        if (email && phone) {
            searchQuery.body = {
                query: {
                    bool: {
                        should: [
                            {
                                bool: {
                                    must: [
                                        {
                                            match_phrase: {
                                                'email.value': email,
                                            }
                                        },
                                        {
                                            match: {
                                                'email.valid': true,
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                bool: {
                                    must: [
                                        {
                                            regexp: {
                                                'phone.value': `[^0]+"${phone}"`,
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                },
                sort: [
                    '_score',
                    {created_at: 'asc'},
                    {updated_at: 'desc'},
                ],
            }
        }
        if (email && !phone) {
            searchQuery.body = {
                query: {
                    match_phrase: {
                        'email.value': email,
                    }
                },
            }
        }
        if (!email && phone) {
            searchQuery.body = {
                query: {
                    regexp: {
                        'phone.value': `[^0]+"${phone}"`,
                    }
                },
            }
        }
        let eslead;
        try {
            const { body } = await client.search(searchQuery);
            if (body.hits.total.value === 0) {
                return false;
            } else if (body.hits.total.value > 0) {
                eslead = Object.assign(body.hits.hits[0]);
            }
        }
        catch (error) {
            console.warn(`Could not capture conversion for lead ${JSON.stringify({email, phone})} due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
            return false;
        }
        const update = {
            conversions: eslead['_source'].conversions,
            tags: eslead['_source'].tags,
        };
        if (!Array.isArray(update.conversions)) {
            update.conversions = [];
        }
        if (!Array.isArray(update.tags)) {
            update.tags = [];
        }
        if ('string' === typeof(tags) && tags.length > 0) {
            const split = tags.split(',');
            for (let i = 0; i < split.length; i++) {
                const tag = split[i];
                const ct = sanitizor.trim(tag).toLowerCase();
                if (update.tags.indexOf(ct) === -1) {
                    update.tags.push(ct);
                }
                if (push.tags.indexOf(ct) === -1) {
                    push.tags.push(ct);
                }
            }
        }
        update.conversions.push(conversion);
        try {
            const {statusCode, body} = await client.update({
                index: 'leads',
                refresh: true,
                retry_on_conflict: 5,
                id: eslead['_id'],
                body: {
                    doc: update
                },
            });
            return {statusCode, body};
        } catch (error) {
            console.warn(`Could not capture conversion for lead ${JSON.stringify({email, phone})} due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
            return false;
        }
    }

    _addBrokerToBrokersArray(map) {
        if (map.has('broker') && null !== map.get('broker')) {
            map.set('brokers', [map.get('broker')])
        }
        return map;
    }

    _fixNameValue(value) {
        if ('string' !== typeof(value)) {
            return null;
        }
        const titleCase = require('title-case');
        value = sanitizor.escape(value);
        value = value.replace(/\d+/g, '');
        if (value.length === 0) {
            return null;
        }
        return titleCase(value);
    }

    _getBestOptionForField(field, newLead, oldLead) {
        const newVal = newLead.get(field);
        const oldVal = oldLead[field];
        // if the new value doesn't exist, return the old value
        if ('object' !== typeof(newVal) || null === newVal) {
            return oldVal;
        }
        // if the old value doesn't exist, return the new value
        if ('object' !== typeof(oldVal) || null === oldVal) {
            return newVal;
        }
        // if the old value is valid and the new value isn't, return the old value
        if (oldVal.valid && !newVal.valid) {
            return oldVal;
        }
        // if the old value isn't valid and the new value is, return the new value
        if (!oldVal.valid && newVal.valid) {
            return newVal;
        }
        // if the old value and the new value are the same, just the new value (since it might have more information)
        if (oldVal.value === newVal.value) {
            return newVal;
        }
        // if both values are valid and they are different, apply some logic depending on the field
        if (oldVal.valid && newVal.valid) {
            switch(field) {
                case 'phone':
                    return this._getBestPhoneValue({
                        newVal,
                        oldVal,
                        newCountry: newLead.get('country'),
                        oldCountry: oldLead.country,
                        newGeoIP: newLead.get('geoip'),
                        oldGeoIP: oldLead.geoip,
                    });

                case 'email':
                    return newVal;

                case 'country':
                    return this._getBestCountryValue({
                        newVal,
                        oldVal,
                        newGeoIP: newLead.get('geoip'),
                        oldGeoIP: oldLead.geoip,
                    });

                case 'geoip':
                    return this._getBestGeoIPValue({
                        newVal,
                        oldVal,
                        newCountry: newLead.get('country'),
                        oldCountry: oldLead.country
                    });
                    break;
            }
        }
        // if none of the conditions above are valid, return null
        return null;
    }

    _getBestGeoIPValue({newVal, oldVal, newCountry, oldGeoIP}) {
        const isos = {};
        if ('undefined' === typeof(isos[newVal.value])) {
            isos[newVal.value] = 1;
        }
        else {
            isos[newVal.value] ++;
        }
        if ('undefined' === typeof(isos[oldVal.value])) {
            isos[oldVal.value] = 1;
        }
        else {
            isos[oldVal.value] ++;
        }
        if ('object' === typeof(newCountry) && null !== newCountry && true === newCountry.valid && 'string' === typeof(newCountry.value)) {
            if ('undefined' === typeof(isos[newCountry.value])) {
                isos[newCountry.value] = 1;
            }
            else {
                isos[newCountry.value] ++;
            }
        }
        if ('object' === typeof(oldCountry) && null !== oldCountry && true === oldCountry.valid && 'string' === typeof(oldCountry.value)) {
            if ('undefined' === typeof(isos[oldCountry.value])) {
                isos[oldCountry.value] = 1;
            }
            else {
                isos[oldCountry.value] ++;
            }
        }
        const newValCount = isos[newVal.iso];
        const oldValCount = isos[oldVal.iso];
        // if there is equal concencus on the new and old countries, return the newer value
        if (newValCount === oldValCount) {
            return newVal;
        }
        if (newValCount > 0 && newValCount > oldValCount) {
            return newVal;
        }
        if (oldValCount > 0 && oldValCount > newValCount) {
            return oldVal;
        }
        // and by default, return the newer value
        return newVal;
    }

    _getBestCountryValue({newVal, oldVal, newGeoIP, oldGeoIP}) {
        const isos = {};
        if ('undefined' === typeof(isos[newVal.value])) {
            isos[newVal.value] = 1;
        }
        else {
            isos[newVal.value] ++;
        }
        if ('undefined' === typeof(isos[oldVal.value])) {
            isos[oldVal.value] = 1;
        }
        else {
            isos[oldVal.value] ++;
        }
        if ('object' === typeof(newGeoIP) && null !== newGeoIP && true === newGeoIP.valid && 'string' === typeof(newGeoIP.value)) {
            if ('undefined' === typeof(isos[newGeoIP.value])) {
                isos[newGeoIP.value] = 1;
            }
            else {
                isos[newGeoIP.value] ++;
            }
        }
        if ('object' === typeof(oldGeoIP) && null !== oldGeoIP && true === oldGeoIP.valid && 'string' === typeof(oldGeoIP.value)) {
            if ('undefined' === typeof(isos[oldGeoIP.value])) {
                isos[oldGeoIP.value] = 1;
            }
            else {
                isos[oldGeoIP.value] ++;
            }
        }
        const newValCount = isos[newVal.iso];
        const oldValCount = isos[oldVal.iso];
        // if there is equal concencus on the new and old countries, return the newer value
        if (newValCount === oldValCount) {
            return newVal;
        }
        if (newValCount > 0 && newValCount > oldValCount) {
            return newVal;
        }
        if (oldValCount > 0 && oldValCount > newValCount) {
            return oldVal;
        }
        // and by default, return the newer value
        return newVal;
    }

    _getBestPhoneValue({newVal, oldVal, newCountry, oldCountry, newGeoIP, oldGeoIP}) {
        // If the phone numbers countries match, then return the newer value
        if (newVal.iso === oldVal.iso) {
            return newVal;
        }
        const isos = {};
        if ('undefined' === typeof(isos[newVal.iso])) {
            isos[newVal.iso] = 1;
        }
        else {
            isos[newVal.iso] ++;
        }
        if ('undefined' === typeof(isos[oldVal.iso])) {
            isos[oldVal.iso] = 1;
        }
        else {
            isos[oldVal.iso] ++;
        }
        if ('object' === typeof(newCountry) && null !== newCountry && true === newCountry.valid && 'string' === typeof(newCountry.value)) {
            if ('undefined' === typeof(isos[newCountry.value])) {
                isos[newCountry.value] = 1;
            }
            else {
                isos[newCountry.value] ++;
            }
        }
        if ('object' === typeof(oldCountry) && null !== oldCountry && true === oldCountry.valid && 'string' === typeof(oldCountry.value)) {
            if ('undefined' === typeof(isos[oldCountry.value])) {
                isos[oldCountry.value] = 1;
            }
            else {
                isos[oldCountry.value] ++;
            }
        }
        if ('object' === typeof(newGeoIP) && null !== newGeoIP && true === newGeoIP.valid && 'string' === typeof(newGeoIP.value)) {
            if ('undefined' === typeof(isos[newGeoIP.value])) {
                isos[newGeoIP.value] = 1;
            }
            else {
                isos[newGeoIP.value] ++;
            }
        }
        if ('object' === typeof(oldGeoIP) && null !== oldGeoIP && true === oldGeoIP.valid && 'string' === typeof(oldGeoIP.value)) {
            if ('undefined' === typeof(isos[oldGeoIP.value])) {
                isos[oldGeoIP.value] = 1;
            }
            else {
                isos[oldGeoIP.value] ++;
            }
        }
        const newValCount = isos[newVal.iso];
        const oldValCount = isos[oldVal.iso];
        // if there is equal concencus on the new and old countries, return the newer value
        if (newValCount === oldValCount) {
            return newVal;
        }
        if (newValCount > 0 && newValCount > oldValCount) {
            return newVal;
        }
        if (oldValCount > 0 && oldValCount > newValCount) {
            return oldVal;
        }
        // and by default, return the newer value
        return newVal;
    }

    _getCombinedAndUniqueArray(aoa) {
        const set = new Set();
        if (Array.isArray(aoa)) {
            for (let i = 0; i < aoa.length; i++) {
                const arr = aoa[i];
                if (Array.isArray(arr)) {
                    for (let ai = 0; ai < arr.length; ai++) {
                        const val = arr[ai];
                        set.add(val);
                    }
                }
                else if ('object' === typeof(arr)) {
                    const vals = Object.values(arr);
                    for (let ai = 0; ai < vals.length; ai++) {
                        const val = vals[ai];
                        set.add(val);
                    }
                }
                else if (['boolean', 'number', 'string'].indexOf(typeof(arr)) > -1) {
                    set.add(arr);
                }
            }
        }
        return [...set];
    }

    _removeInvalidFields(map) {
        map.forEach((value, key) => {
            switch(typeof(value)) {
                case 'string':
                    if (value.length === 0) {
                        map.delete(key);
                    }
                    break;

                case 'object':
                    if (null === value) {
                        map.delete(key);
                    }
                    else if ('boolean' === typeof(value.valid) && !value.valid) {
                        map.delete(key);
                    }
                    break;

                case 'number':
                    break;

                case 'boolean':
                    break;

                default:
                    map.delete(key);
                    break;
            }
        });
        return map;
    }

    _fixPhoneAccordingToCountry(map, typeMap) {
        const countryFields = this._getFieldsOfType('country', map, typeMap);
        const phoneFields = this._getFieldsOfType('phone', map, typeMap);
        const country = this._getFirstMapResult(countryFields);
        const countries = require('../../database/countries.json');
        if ('object' === typeof(country) && null !== country && country.valid) {
            phoneFields.forEach((value, key) => {
                if (!value.valid || (value.iso !== country.value && countries[value.iso].prefix !== countries[country.value].prefix)) {
                    const info = this._getPhoneWithIsoInfo(value.value, country.value);
                    if (info.valid) {
                        map.set(key, info);
                    }
                }
            });
        }
        return map;
    }

    _addCountryIfMissingByPhone(map, typeMap) {
        const countryFields = this._getFieldsOfType('country', map, typeMap);
        const phoneFields = this._getFieldsOfType('phone', map, typeMap);
        const phone = this._getFirstMapResult(phoneFields);
        if ('object' === typeof(phone) && null !== phone && phone.valid) {
            if (countryFields.size === 0) {
                map.set('country', {
                    valid: true,
                    value: phone.iso,
                });
            }
            else {
                countryFields.forEach((value, key) => {
                    map.set(key, {
                        valid: true,
                        value: phone.iso,
                    }); 
                });
            }
        }
        return map;
    }

    async _addCountryIfMissingByIp(map, typeMap) {
        const countryFields = this._getFieldsOfType('country', map, typeMap);
        const ipFields = this._getFieldsOfType('ip', map, typeMap);
        const ip = this._getFirstMapResult(ipFields);
        if (countryFields.size === 0 && ipFields.size > 0) {
            if ('string' === typeof(ip) && ip.length > 0) {
                const iso = await this._getCountryFromIp(ip);
                if ('string' === typeof(iso)) {
                    map.set('country', {
                        valid: true,
                        value: iso,
                    });
                }
            }
        }
        if ('string' === typeof(ip) && ip.length > 0) {
            const iso = await this._getCountryFromIp(ip);
            if ('string' === typeof(iso)) {
                map.set('geoip', {
                    ip,
                    valid: true,
                    value: iso,
                });
            }
        }
        return map;
    }

    _getFirstMapResult(map) {
        let val;
        map.forEach( (value) => {
            if ('undefined' === typeof(val) && (
                ('string' === typeof(value) && value.length > 0)
                || ('object' === typeof(value) && 'boolean' === typeof(value.valid) && true === value.valid)
                || ('number' === typeof(value))
                || ('boolean' === typeof(value))
            )) {
                val = value;
            }
        });
        return val;
    }

    _getFieldsOfType(type, map, typeMap) {
        const ret = new Map();
        map.forEach( (value, key) => {
            const t = typeMap.get(key);
            if (t === type) {
                ret.set(key, value);
            }
        });
        return ret;
    }

    async _formatCell(value, type, column) {
        switch(type) {
            case 'name':
                if ('undefined' === typeof(value) || 'null' === value || '' === value) {
                    return null;
                } else {
                    return this._fixNameValue(value);
                }

            case 'email':
                const ret = {
                    valid: await this._valid('email', value),
                    value: sanitizor.normalizeEmail(value),
                }
                if (ret.value === '@') {
                    ret.valid = false;
                    ret.value = null;
                }
                return ret;

            case 'phone':
                return this._getPhoneInfoWithoutIso(value);

            case 'country':
                const iso = this._getCountry(value);
                return {
                    valid: ('string' === typeof(iso) && 2 === iso.length),
                    value: ('string' === typeof(iso) && 2 === iso.length) ? iso.toUpperCase() : null,
                };

            case 'fullname':
                return this._getFullNameAsParts(value);

            case 'leadpagesphone':
                return this._getLeadPagesPhoneAsParts(value);

            case 'ip':
                const valid = await this._valid('ip', value);
                return (valid) ? value.toLowerCase() : null;

            case 'date':
                return this._getFormattedDate(value, ('object' === typeof(column.options) && 'string' === typeof(column.options.format)) ? column.options.format : null);

            case 'datetime':
                return this._getFormattedDate(value, ('object' === typeof(column.options) && 'string' === typeof(column.options.format)) ? column.options.format : null);

            default:
                if ('undefined' === typeof(value) || 'null' === value || '' === value) {
                    return null;
                } else {
                    return value;
                }
        }
    }

    async _formatLeadMap(map, settings) {
        /**
         * Once the mapped lead has been created with all details
         * multi-parameter validation can be run, such as for:
         * - country
         * - phone number
         * ------------------------------------------------------
         * Step 1: If the country is not valid and there is an IP address, update from the IP address
         * Step 2: If the country is not valid and there is a valid phone number, update from the phone number
         * Step 3: If the phone number's country does not match the country, and the updated country is valid for the phone number, update the phone number
         * Step 4: If the phone number is not valid, update the phone number
         * Step 5: If the phone number is not valid but there is a valid phone number, try to update the settings and see if it is valid
         */
        const definitiveIp = this._getDefinitiveValueForType('ip', settings, map);
        const definitivePhone = this._getDefinitiveValueForType('phone', settings, map);
        /**
         * Loop for 1 & 2
         */
        for (let cid in settings) {
            const column = settings[cid];
            const id = parseInt(cid);
            const value = map.get(id);
            if ( ('country' === column.type && (!value.valid)) || ('leadpagesphone' === column.type && (!value.country.valid)) ){
                if (definitiveIp) {
                    const iso = await this._getCountryFromIp(definitiveIp);
                    if (iso) {
                        if ('country' === column.type) {
                            map.set(id, {
                                valid: true,
                                value: iso,
                            });
                        }
                        if ('leadpagesphone' === column.type) {
                            const newval = {
                                country: {
                                    valid: true,
                                    value: iso,
                                },
                                phone: this._getPhoneWithIsoInfo(value.phone.value, iso),
                            }
                            if (newval.phone.valid) {
                                newval.valid = true;
                            }
                            map.set(id, newval);
                        }
                    }
                }
                else if (definitivePhone) {
                    const iso = definitivePhone.iso;
                    if ('country' === column.type) {
                        map.set(id, {
                            valid: true,
                            value: iso,
                        });
                    }
                    if ('leadpagesphone' === column.type) {
                        const newval = {
                            country: {
                                valid: true,
                                value: iso,
                            },
                            phone: this._getPhoneWithIsoInfo(value.phone.value, iso),
                        }
                        if (newval.phone.valid) {
                            newval.valid = true;
                        }
                        map.set(id, newval);
                    }
                }
            }
        }
        /**
         * Loop for 3, 4 and 5
         */
        const definitiveCountry = this._getDefinitiveValueForType('country', settings, map);
        if (definitiveCountry) {
            for (let cid in settings) {
                const column = settings[cid];
                const id = parseInt(cid);
                const value = map.get(id);
                if ('phone' === column.type) {
                    const info = this._getPhoneWithIsoInfo(value.value, definitiveCountry.value);
                    if (info.valid) {
                        map.set(id, info);
                    }
                }
                if ('leadpagesphone' === column.type) {
                    const info = this._getPhoneWithIsoInfo(value.phone.value, definitiveCountry.value);
                    if (info.valid) {
                        const update = {
                            country: definitiveCountry,
                            phone: info
                        };
                        if (update.country.valid && update.phone.valid) {
                            update.valid = true;
                        }
                        map.set(id, update);
                    }
                }
            }
        }
        return map;
    }

    _getDefinitiveValueForType(type, settings, map) {
        const options = {};
        let ret;
        for (let cid in settings) {
            const column = settings[cid];
            const id = parseInt(cid);
            const value = map.get(id);
            if (type === column.type) {
                if (
                    ('object' === typeof(value) && null !== value && 'boolean' === typeof(value.valid) && true === value.valid)
                    || 'object' !== typeof(value)
                ) {
                    options[column.name] = value;
                }
            }
            if ('phone' === type && column.type === 'leadpagesphone') {
                if (
                    ('object' === typeof(value.phone) && null !== value.phone && 'boolean' === typeof(value.phone.valid) && true === value.phone.valid)
                    || 'object' !== typeof(value.phone)
                ) {
                    options.leadpagesphone = value.phone;
                }
            }
            if ('country' === type && column.type === 'leadpagesphone') {
                if (
                    ('object' === typeof(value.country) && null !== value.country && 'boolean' === typeof(value.country.valid) && true === value.country.valid)
                    || 'object' !== typeof(value.country)
                ) {
                    options.leadpagescountry = value.country;
                }
            }
        }
        if (Object.keys(options).length === 1) {
            ret = options[Object.keys(options)[0]];
        }
        else if ('undefined' !== typeof(options[type])) {
            ret = options[type];
        }
        else if (Object.keys(options).length > 0){
            ret = options[Object.keys(options)[0]];
        }
        return ret;
    }

    async _valid(rule, value) {
        const rules = {
            input: rule,
        }
        const validation = await validate({input: value}, rules);
        return !(validation.fails());
    }

    _getFormattedDate(value, format) {
        if (['now', 'NOW', 'now()', 'NOW()', 'Now()'].indexOf(value) >= 0) {
            return moment().format();
        }
        else if ('string' === typeof(format) && format.length > 0) {
            const obj = moment(value, format);
            if (obj.isValid()) {
                return obj.format();
            } else {
                return null;
            }
        } else {
            const obj = moment(value);
            if (obj.isValid()) {
                return obj.format();
            } else {
                return null;
            }
        }
    }

    _getCountry(iso) {
        if ('string' === typeof(iso)) {
            if (iso.length === 2) {
                iso = iso.toUpperCase();
            }
            else if (isNaN(iso)) {
                const { getCode } = require('country-list');
                try {
                    iso = getCode(iso);
                } catch (error) {
                    console.warn(`Unable to parse country ${iso}: ${error.toString()}`);
                }
            }
            else {
                /**
                 * @todo: get list of country ids from spotoption and look up by that
                 */
            }
        } else {
            iso = null;
        }
        return iso;
    }

    _getFullNameAsParts(string) {
        const obj = this._splitStringIntoObject(string, ['fname', 'mname', 'lname']);
        if ('object' !== typeof(obj) || null === obj) {
            return {
                valid: false,
                fname: null,
                mname: null,
                lname: null,
            }
        }
        for (let [key, value] of Object.entries(obj)) {
            if ('string' === typeof(value)) {
                obj[key] = this._fixNameValue(value);
            }
        }
        return obj;
    }

    _getLeadPagesPhoneAsParts(string) {
        const obj = this._splitStringIntoObject(string, ['country', 'phone']);
        if ('object' !== typeof(obj) || null === obj) {
            return {
                valid: false,
                phone: {
                    valid: false,
                    is_mobile: false,
                    is_landline: false,
                    iso: 'XX',
                    value: null,
                },
                country: {
                    valid: false,
                    value: 'XX',
                }
            }
        }
        const iso = this._getCountryByPrefix(obj.country);
        if ('XX' === iso) {
            obj.valid = false;
            obj.country = {
                valid: false,
                value: iso,
            }
            obj.phone = this._getPhoneWithIsoInfo(obj.phone, iso);
        } else {
            obj.country = {
                valid: true,
                value: iso,
            };
            obj.phone = this._getPhoneWithIsoInfo(obj.phone, iso);
            if (obj.country.valid !== true || obj.phone.valid !== true) {
                obj.valid = false;
            }
        }
        return obj;
    }

    _splitStringIntoObject(string, mapping) {
        if ('string' !== typeof(string)) {
            return null;
        }
        const ret = {
            valid: false,
        }
        const parts = string.split(' ');
        if (parts.length > 0) {
            ret.valid = true;
            const fk = mapping.shift();
            ret[fk] = parts.shift();
            const lk = mapping.pop();
            ret[lk] = parts.pop();
            if (mapping.length === parts.length) {
                mapping.forEach( (val, index) => {
                    ret[val] = parts[index];
                })
            }
            else if (parts.length > 1 && mapping.length === 1) {
                const key = mapping.pop();
                ret[key] = parts.join(' ');
            }
            if ('undefined' === typeof(ret[fk])) {
                ret[fk] = null;
            }
            if ('undefined' === typeof(ret[lk])) {
                ret[lk] = null;
            }
        } else {
            for (let i = 0; i < mapping.length; i++) {
                const key = mapping[i];
                ret[key] = null;
            }
        }
        for (let i = 0; i < mapping.length; i++) {
            const key = mapping[i];
            if ('undefined' === typeof(ret[key])) {
                ret[key] = null;
            }
        }
        return ret;
    }

    _getCountryByPrefix(prefix) {
        if (isNaN(prefix)) {
            return 'XX';
        }
        prefix = parseInt(prefix);
        const countries = require('../../database/countries.json');
        for (let iso in countries) {
            const country = countries[iso];
            if (prefix === country.prefix) {
                return iso;
            }
        }
        return 'XX';
    }

    _getPhoneInfoWithoutIso(value) {
        value = `${value}`;
        value = value.replace(/\D/g,'');
        const countries = require('../../database/countries.json');
        const countriesByPrefix = {};
        for (let iso in countries) {
            const prefix = countries[iso].prefix;
            if (prefix > 0) {
                countriesByPrefix[prefix] = iso;
            }
        }
        const sortedPrefixes = Object.keys(countriesByPrefix).sort(function(a, b){return b-a});
        for (let i = 0; i < sortedPrefixes.length; i++) {
            const prefix = sortedPrefixes[i];
            if (prefix == value.substring(0, prefix.length)) {
                const iso = countriesByPrefix[prefix];
                const info = this._getPhoneWithIsoInfo(value, iso);
                if (info.valid) {
                    info.value = value;
                    return info;
                }
            }
        }
        return this._getPhoneWithIsoInfo(value, 'XX');
    }

    _getPhoneWithIsoInfo(value, iso) {
        value = `${value}`;
        const feedback = {
            valid: false,
            is_mobile: false,
            is_landline: false,
            iso,
            value,
        }
        const PNF = require('google-libphonenumber').PhoneNumberFormat;
        const PNT = require('google-libphonenumber').PhoneNumberType;
        const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
        let number;
        try {
            number = phoneUtil.parseAndKeepRawInput(`${value}`, iso);
            feedback.valid = phoneUtil.isValidNumber(number);
            feedback.type = phoneUtil.getNumberType(number);
        } catch (error) {
            // do nothing as we have an error with the number
        }
        if (feedback.valid) {
            try {
                feedback.is_mobile = ([PNT.FIXED_LINE_OR_MOBILE, PNT.MOBILE].indexOf(feedback.type) > -1);
                feedback.is_landline = ([PNT.FIXED_LINE_OR_MOBILE, PNT.FIXED_LINE].indexOf(feedback.type) > -1);
                feedback.value = phoneUtil.format(number, PNF.E164).replace('+', '');
                feedback.preview = phoneUtil.format(number, PNF.INTERNATIONAL);
            } catch (error) {
                console.warn(error);
                newrelic.noticeError(error);
            }
        } else {
            feedback.preview = feedback.value;
        }
        return feedback;
    }

    async _getCountryFromIp(ip) {
        const Helpers = use('Helpers');
        let iso;
        if ('string' === typeof(ip) && ip.length > 0 && await this._valid('ip', ip)) {
            const {Reader} = require('@maxmind/geoip2-node');
            const options = {};
            const dbpath = Helpers.resourcesPath('maxmind/GeoLite2-Country.mmdb');
            try {
                const reader = await Reader.open(dbpath, options);
                const result = reader.country(ip);
                if ('object' === typeof(result)
                && 'object' === typeof(result.country)
                && 'string' === typeof(result.country.isoCode)) {
                    iso = result.country.isoCode;
                }
                else if ('object' === typeof(result)
                && 'object' === typeof(result.registeredCountry)
                && 'string' === typeof(result.registeredCountry.isoCode)) {
                    iso = result.registeredCountry.isoCode;
                }
                else {
                    console.warn(`Error Retrieving Country for IP ${ip}:`);
                    console.warn(result);
                }
            } catch (error) {
                    console.warn(`Error Retrieving Country for IP ${ip}: ${error.toString()}`);
                    console.warn(error);
            }
        }
        return iso;
    }
}

module.exports = LeadImporter;