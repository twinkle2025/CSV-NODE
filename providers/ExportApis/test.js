'use strict'

const axios = require('axios');
const qs = require('qs');

class TestApi {
    constructor (api) {
        this.config = api.configuration;
    }

    async exportLeads(leads, onLeadSuccess, onLeadError, onError, onSuccess) {
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];
            try {
                const result = await this.subscribe(lead, onLeadSuccess, onLeadError);
                onLeadSuccess(result);
            } catch (error) {
                onLeadError(lead, error);
            }
            await this.sleep(500);
        }
        await onSuccess();
    }

    async subscribe(data, onLeadSuccess, onLeadError) {
        let response;
        try {
            response = await axios.post(this.config.url, data);
        }
        catch (error) {
            await onLeadError(data, error);
            return false;
        }
        await onLeadSuccess(data);
        return response.data;
    }

    chunk(arr, len) {
        let chunks = [];
        let i = 0;
        let n = arr.length;
        while (i < n) {
            chunks.push(arr.slice(i, i += len));
        }
        return chunks;
    }

    sleep(ms) {
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }
}

module.exports = TestApi;