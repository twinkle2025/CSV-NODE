'use strict'

const axios = require('axios');
const qs = require('qs');
const sleep = use('sleep');

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

class AtomParkCaptureFormApi {
    constructor (api) {
        this.config = api.configuration;
    }

    async exportLeads(leads, onLeadSuccess, onLeadError, onError, onSuccess) {
        const cfe = use('chunkedForEach');
        await cfe(leads, 5, async ({value}) => {
            const lead = value;
            try {
                const result = await this.subscribe(lead, onLeadSuccess, onLeadError);
                onLeadSuccess(result);
            } catch (error) {
                console.warn(error);
                onLeadError(lead, error);
            }
            const sleepTime = getRandomArbitrary(1000, 10000);
            console.log(`sleeping for ${sleepTime} ms`);
            await this.sleep(sleepTime);
        });
        await onSuccess();
    }

    async subscribe(data, onLeadSuccess, onLeadError) {
        // console.log(data, this.config);
        const query = {
            callback: this.config.callback,
            sform: {
                type: {},
                phone: data.phone,
                hash: this.config.hash,
            }
        }
        query.sform[this.config.fnameField] = data.fname,
        query.sform.type[this.config.fnameField] = 'string';
        const url = `${this.config.url}?${qs.stringify(query)}`;
        let response;
        try {
            response = await axios.get(url);
            console.log(response.data);
        }
        catch (error) {
            console.warn(error);
            await onLeadError(data, error);
            return false;
        }
        // await onLeadSuccess(data);
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

module.exports = AtomParkCaptureFormApi;