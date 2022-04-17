'use strict'

const axios = require('axios');
const moment = require('moment');
const qs = require('qs');
const md5 = require('md5');

/**
 * Based on AtomPark API Docs found:
 * https://atomic.center/sms/apiv3/
 */

class AtomPark {
    constructor (api) {
        this.config = api.configuration;
    }

    async send(message) {
        const query = {
            version: '3.0',
            action: 'sendSMS',
            key: this.config.public_key,
            sender: message.subject,
            text: message.body,
            phone: message.destination,
            datetime: '',
            sms_lifetime: 0,
        }
        const sum = this._getSum(query);
        const url = `${this.config.url}/api/sms/3.0/sendSMS?key=${query.key}&sum=${sum}&sender=${query.sender}&text=${encodeURIComponent(query.text)}&phone=${query.phone}&datetime=${query.datetime}&sms_lifetime=${query.sms_lifetime}`;
        try {
            const {data} = await axios.get(url);
            if (data.error) {
                console.warn(data);
                return 'failed';
            } else {
                return 'enqueued';
            }
        } catch (error) {
            console.warn(error);
            return 'failed';
        }
    }

    _getSum(params) {
        let keys = Object.keys(params);
        let result = '';
        const parts = [];
        keys.sort();
        keys.forEach((key) => {
            //This is hack for correct md5 summ calculating
            //when we have array value in param, we must concatenate with 'Array' string
            //instead of value of this array =\
            //because of PHP origin of EPochta engine
            if (Array.isArray(params[key])) {
                parts.push('array');
                result += "Array";
            } else {
                parts.push(String(params[key]));
                result += String(params[key]);
            }
        });
        result += this.config.private_key;
        parts.push(this.config.private_key);
        return md5(result);
    }
}

module.exports = AtomPark;