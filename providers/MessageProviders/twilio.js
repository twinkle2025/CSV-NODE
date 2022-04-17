'use strict'

const axios = require('axios');
const moment = require('moment');
const qs = require('qs');
const md5 = require('md5');

/**
 * Based on Twilio API Docs
 */

class Twilio {
    constructor (api) {
        this.config = api.configuration;
    }

    async send(message) {
        const client = require('twilio')(this.config.sid, this.config.token);
        try {
            const m = await client.messages.create({
                body: message.body,
                from: this.config.sender_phone,
                to: message.destination,
            });
            console.log(`Enqueued Twilio Message:`, m);
            return 'enqueued';
        } catch (error) {
            console.warn(error);
            return 'failed';
        }
    }
}

module.exports = Twilio;