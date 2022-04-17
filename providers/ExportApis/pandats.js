'use strict'

const axios = require('axios');
const moment = require('moment');
const qs = require('qs');

/**
 * Based on Panda API Docs found:
 * https://trade99.pandats-api.io/#api-Leads-Leads
 */

class PandaTS {
    constructor (api) {
        this.config = api.configuration;
    }

    async exportLeads(leads, onLeadSuccess, onLeadError, onError, onSuccess) {
        await this.sleep(1000);
        const jwt = await this.authorize();
        const cfe = use('chunkedForEach');
        await cfe(leads, 5, async ({value}) => {
            const lead = value;
            if ('string' === typeof(this.config.source) && ('string' !== typeof(lead.leadSource) || lead.leadSource.length === 0)) {
                lead.leadSource = this.config.source;
            }
            try {
                const result = await this.subscribe(lead, jwt);
                if ([200, 201].indexOf(result.status) > -1) {
                    await onLeadSuccess(lead);
                } else {
                    await onLeadError(lead, `Subscription for Lead ${JSON.stringify(lead)} returned ${JSON.stringify(result)}`);
                }
            } catch (error) {
                console.warn(error);
                await onLeadError(lead, error);
            }
        });
        await onSuccess();
    }

    async authorize() {
        const time = moment().unix();
        const accessKey = require('crypto').createHash('sha1').update(`${this.config.partner_id}${time}${this.config.partner_secret}`).digest('hex');
        const response = await this.post('/api/v3/authorization', {
            partnerId: this.config.partner_id,
            accessKey,
            time,
        });
        if (200 === response.status) {
            const jwt = response.data.data.token;
            return jwt;
        }
        return false;
    }

    async subscribe(data, jwt) {
        if('undefined' === typeof(jwt)) {
            jwt = await this.authorize();
        }
        const response = await this.post('/api/v3/leads', data, {
            Authorization: `Bearer ${jwt}`
        });
        return {
            status: response.status,
            data: response.data.data,
            errors: response.data.error
        }
    }

    async note(email, note, jwt) {
        if('undefined' === typeof(jwt)) {
            jwt = await this.authorize();
        }
        const response = await this.post(`/api/v3/customers/${email}/comments`, {
            content: note,
        }, {
            Authorization: `Bearer ${jwt}`
        });
        return {
            status: response.status,
            data: response.data.data,
            errors: response.data.error
        }
    }

    async get(uri, headers) {
        const url = `${this.config.url}${uri}`;
        try {
            const response = await axios.request({
                url,
                headers,
                method: 'GET',
            });
            return response;
        }
        catch (error) {
            if (error.response) {
                return error.response;
            }
            throw error;
        }
    }

    async post(uri, data, headers) {
        headers = this.fixHeaders(headers);
        const url = `${this.config.url}${uri}`;
        try {
            const response = await axios.request({
                url,
                headers,
                data: qs.stringify(data),
                method: 'POST',
            });
            return response;
        }
        catch (error) {
            if (error.response) {
                return error.response;
            }
            throw error;
        }
    }

    async put(uri, data, headers) {
        headers = this.fixHeaders(headers);
        const url = `${this.config.url}${uri}`;
        try {
            const response = await axios.request({
                url,
                headers,
                data: qs.stringify(data),
                method: 'PUT',
            });
            return response;
        }
        catch (error) {
            if (error.response) {
                return error.response;
            }
            throw error;
        }
    }

    async delete(uri, headers) {
        const url = `${this.config.url}${uri}`;
        try {
            const response = await axios.request({
                url,
                headers,
                method: 'DELETE',
            });
            return response;
        }
        catch (error) {
            if (error.response) {
                return error.response;
            }
            throw error;
        }
    }

    fixHeaders(headers) {
        if ('undefined' === typeof(headers) || null === headers) {
            headers = {};
        }
        return Object.assign(headers, { 'content-type': 'application/x-www-form-urlencoded' });
    }

    sleep(ms) {
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }
}

module.exports = PandaTS;