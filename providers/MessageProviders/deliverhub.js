'use strict'

const axios = require('axios');
const moment = require('moment');
const qs = require('qs');
const md5 = require('md5');

/**
 * Based on DeliverHub API Docs
 */

class DeliverHub {
    constructor (api) {
        this.config = api.configuration;
        this.config.url = 'https://www.deliverhub.site/PulseemSendServices.asmx?wsdl';
    }

    async send(message) {
        return 'failed';
        const soap = require('soap');
        const query = {
            userID: this.config.userID,
            password: this.config.password,
            fromNumber: message.subject,
            text: message.body,
            toNumber: message.destination,
            reference: '',
            sms_lifetime: 0,
            delayDeliveryMinutes: 0,
            isResponse: false,
            isAutomaticUnsubscribeLink: false,
        }
        try {
            const client = await soap.createClientAsync(this.config.url);
            const result = await client.SendSingleSMSAsync(query);
            console.log(result);
            return 'enqueued';
        } catch (error) {
            console.warn(error);
            return 'failed';
        }
    }
}

module.exports = DeliverHub;