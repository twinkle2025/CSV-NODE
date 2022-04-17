'use strict'

const newrelic = require('newrelic');
const EnqueuedMessage = use('App/Models/EnqueuedMessage');
const EnqueuedEmail = use('App/Models/EnqueuedEmail');
const importer = use('importer');
const cfe = use('chunkedForEach');
const MessageBlast = use('App/Models/MessageBlast');

class MessageQueue {
    async enqueue(blast) {
        switch (blast.service) {
            case 'email':
                return await this._enqueueEmail(blast);

            case 'sms':
                return await this._enqueueSMS(blast);
        }
    }

    async _enqueueSMS(blast) {
        /**
         * 1. Process Manual Recipients
         * 2. Process queried recipients
         */
        // #1
        const manualRecipients = await this._getManualRecipientsAsArray(blast.configuration.manual_recipients);
        cfe(manualRecipients, 5, async ({value}) => {
            if ('object' === typeof(value) && null !== value) {
                // add the enqueued message
                const m = new EnqueuedMessage();
                m.status = 'new';
                m.method = blast.service;
                m.method_id = blast.configuration.provider;
                m.blast_id = blast.id;
                m.lead_id = value._id;
                m.destination = value.phone.value;
                m.subject = this._renderText(blast.configuration.subject, value);
                m.body = this._renderText(blast.configuration.body, value);
                m.send_at = this._getSendAtForLead(blast.configuration.send_at, value);
                if ('sms' === blast.service) {
                    m.subject = this._fixSenderId(m.subject);
                }
                try {
                    await m.save();
                } catch (error) {
                    console.warn(error);
                    newrelic.noticeError(error);
                }
            }
        });
        // #2
        if (
            (blast.configuration.recipient_query.usesAdvancedQuery === false && blast.configuration.recipient_query.search.length > 0)
            || (blast.configuration.recipient_query.usesAdvancedQuery === true && blast.configuration.recipient_query.searchQuery.length > 0)
        ) {
            const fakeJob = {
                filter_is_advanced: blast.configuration.recipient_query.usesAdvancedQuery,
                filter_query: (blast.configuration.recipient_query.usesAdvancedQuery) ? blast.configuration.recipient_query.searchQuery : blast.configuration.recipient_query.search,
            };
            await this._fetchRecordsAsAndRunCallback(fakeJob, async (lead) => {
                if ('object' === typeof(lead._source.phone)) {
                    const m = new EnqueuedMessage();
                    m.status = 'new';
                    m.method = blast.service;
                    m.method_id = blast.configuration.provider;
                    m.blast_id = blast.id;
                    m.lead_id = lead._id;
                    m.destination = lead._source.phone.value;
                    m.subject = this._renderText(blast.configuration.subject, lead._source);
                    m.body = this._renderText(blast.configuration.body, lead._source);
                    m.send_at = this._getSendAtForLead(blast.configuration.send_at, lead._source);
                    if ('sms' === blast.service) {
                        m.subject = this._fixSenderId(m.subject);
                    }
                    try {
                        await m.save();
                    } catch (error) {
                        console.warn(error);
                        newrelic.noticeError(error);
                    }
                }
            })
        }
    }

    async _enqueueEmail(blast) {
        /**
         * 1. Process Manual Recipients
         * 2. Process queried recipients
         */
        // #1
        const manualRecipients = await this._getManualEmailRecipientsAsArray(blast.configuration.manual_recipients);
        cfe(manualRecipients, 5, async ({value}) => {
            if ('object' === typeof(value) && null !== value) {
                // add the enqueued message
                const m = new EnqueuedEmail();
                m.send_at = this._getSendAtForLead(blast.configuration.send_at, value);
                m.status = 'new';
                m.to_email = value.email.value;
                m.to_name = this._getEmailNameFromLead(value);
                m.lead_id = value._id;
                m.subject = this._renderText(blast.configuration.subject, value);
                m.content_html = this._renderText(blast.configuration.html, value);
                m.content_text = this._renderText(blast.configuration.text, value);
                m.started = false;
                m.email_account_id = 0;
                m.proxy_id = 0;
                m.failed_proxy = false;
                m.failed_email_account = false;
                m.failed_spam = false;
                m.failed_other = false;
                m.message_blast_id = blast.id;
                try {
                    await m.save();
                } catch (error) {
                    console.warn(error);
                    newrelic.noticeError(error);
                }
            }
        });
        // #2
        if (
            (blast.configuration.recipient_query.usesAdvancedQuery === false && blast.configuration.recipient_query.search.length > 0)
            || (blast.configuration.recipient_query.usesAdvancedQuery === true && blast.configuration.recipient_query.searchQuery.length > 0)
        ) {
            const fakeJob = {
                filter_is_advanced: blast.configuration.recipient_query.usesAdvancedQuery,
                filter_query: (blast.configuration.recipient_query.usesAdvancedQuery) ? blast.configuration.recipient_query.searchQuery : blast.configuration.recipient_query.search,
            };
            await this._fetchRecordsAsAndRunCallback(fakeJob, async (lead) => {
                if ('object' === typeof(lead._source.email)) {
                    const m = new EnqueuedEmail();
                    m.send_at = this._getSendAtForLead(blast.configuration.send_at, lead._source);
                    m.status = 'new';
                    m.to_email = lead._source.email.value;
                    m.to_name = this._getEmailNameFromLead(lead._source);
                    m.lead_id = lead._id;
                    m.subject = this._renderText(blast.configuration.subject, lead._source);
                    m.content_html = this._renderText(blast.configuration.html, lead._source);
                    m.content_text = this._renderText(blast.configuration.text, lead._source);
                    m.started = false;
                    m.email_account_id = 0;
                    m.proxy_id = 0;
                    m.failed_proxy = false;
                    m.failed_email_account = false;
                    m.failed_spam = false;
                    m.failed_other = false;
                    m.message_blast_id = blast.id;
                     try {
                         await m.save();
                     } catch (error) {
                         console.warn(error);
                         newrelic.noticeError(error);
                     }
                }
            })
        }
    }

    async send(message) {
        message.status = 'processing';
        await message.save();
        try {
            const provider = await this.getMessageSenderProvider(message.method, message.method_id);
            message.status = await provider.send(message);
            await message.save();
        } catch (error) {
            console.warn(error);
            message.status = 'error';
            await message.save();
        }
    }

    async sendEmail(EmailMessage) {
        const details = await this._getNextEmailAccountAndProxy();
        if (false === details
            || details.account.current_hourly >= details.account.max_hourly
            || details.account.current_daily >= details.account.max_daily) {
            /**
             * Here, we need to let the interface know that we don't have any active accounts
             */
            EmailMessage.status = 'pending account';
            await EmailMessage.save();
            return false;
        }
        else {
            EmailMessage.status = 'processing';
            EmailMessage.started = true;
            EmailMessage.email_account_id = details.account.id;
            EmailMessage.proxy_id = details.proxy.id;
            await EmailMessage.save();
            details.account.current_hourly ++;
            details.account.current_daily ++;
            await details.account.save();
            this.processEmailSend(EmailMessage, details.account, details.proxy);
            return true;
        }
    }

    async processEmailSend(message, account, proxy) {
        const nodemailer = require("nodemailer");
        const crypto = require("crypto");
        const transportParams = {
            proxy: `${proxy.type}://${proxy.host}:${proxy.port}`,
            host: account.host,
            port: parseInt(account.port),
            secure: ('ssl' == account.encryption),
            auth: {
              user: account.user,
              pass: account.password,
      
            },
            tls: {
                rejectUnauthorized: false
            },
        };
        const sendParams = {
            from: `"${account.name}" <${account.email}>`,
            to: `"${message.to_name}" <${message.to_email}>`,
            subject: message.subject,
            text: message.content_text,
            html: message.content_html,
        }
        const transporter = nodemailer.createTransport(transportParams);
        if (['socks4', 'socks5'].indexOf(proxy.type) > -1) {
            transporter.set('proxy_socks_module', require('socks'));
        }
        message.failed_proxy = false;
        message.failed_email_account = false;
        message.failed_spam = false;
        message.failed_other = false;
        try {
            message.status = 'sending';
            await message.save();
            const info = await transporter.sendMail(sendParams);
            if (info.response.includes('250')) {
                message.status = 'success';
                console.log(`Email sent to ${message.to_email} successfully`);
            } else {
                message.status = info.response.substring(0, 254);
                console.warn(`Email sent to ${message.to_email} returned response ${info.response}`);
            }
            await message.save();
        } catch (error) {
            const msg = error.toString();
            let requeue = false;
            message.status = msg.substring(0, 254);
            switch (msg) {
                case 'Error: Invalid response from proxy: 407':
                    message.failed_proxy = true;
                    break;

                case `Error: connect ECONNREFUSED ${proxy.host}:${proxy.port}`:
                    message.failed_proxy = true;
                    break;

                case 'Error: Socks4 Proxy rejected connection - (Failed)':
                    message.failed_proxy = true;
                    break;

                case 'Error: Proxy connection timed out':
                    message.failed_other = true;
                    requeue = true;
                    break;

                case 'Error: Mail command failed: 501 Sender syntax error':
                    message.failed_other = true;
                    console.warn(msg);
                    console.log(sendParams);
                    break;

                case 'Error: Invalid login: 535 Authentication failed: Bad username / password':
                    message.failed_email_account = true;
                    break;

                case 'Error: Greeting never received':
                    message.failed_other = true;
                    requeue = true;
                    break;

                case 'Error: read ECONNRESET':
                    message.failed_other = true;
                    requeue = true;
                    break;

                default:
                    if (msg.includes('Error: Invalid login: 534-5.7.14')) {
                        message.failed_email_account = true;
                    }
                    else if (msg.includes('Error: Message failed: 550 Message was not accepted -- invalid mailbox')) {
                        message.failed_email_account = true;
                    }
                    else if (msg.includes('Error: Data command failed: 421 4.7.0 Temporary System Problem. Try again later (10). ')) {
                        message.failed_other = true;
                    }
                    else {
                        console.warn(msg);
                        console.warn(error);
                        message.failed_other = true;
                    }
                    break;
            }
            console.warn(`Email sent to ${message.to_email} failed`);
            if (message.failed_proxy == true || message.failed_email_account == true || requeue == true) {
                /**
                 * If the proxy has failed, disable it
                 */
                if (message.failed_proxy == true) {
                    console.log('Email Failed due to Proxy Failure.');
                    proxy.active = false;
                    await proxy.save();
                }
                /**
                 * If the account has failed, disable it
                 */
                if (message.failed_email_account == true) {
                    console.log('Email Failed due to Account Failure.');
                    account.active = false;
                    await account.save();
                }
                /**
                 * Re-enqueue message
                 */
                console.log('Re-enqueing.');
                message.started = false;
                message.proxy_id = 0;
                message.email_account_id = 0;
            }
            await message.save();
        }
    }

    async getMessageSenderProvider(method, id) {
        try {
            switch (method) {
                case 'sms':
                    const SmsProvider = use('App/Models/SmsProvider');
                    const p = await SmsProvider.findOrFail(id);
                    const useString = `message/${p.service}`;
                    const pr = use(useString);
                    return new pr(p);
    
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    async _getNextEmailAccountAndProxy() {
        const Database = use('Database')
        const Proxy = use('App/Models/Proxy');
        const EmailAccount = use('App/Models/EmailAccount');
        const acct = await EmailAccount.query().with('proxy', (builder) => {
            builder.where('active', true)
        }).where('active', true)
        .where('current_hourly', '<', Database.raw('max_hourly'))
        .where('current_daily', '<', Database.raw('max_daily'))
        .orderBy('current_hourly', 'asc')
        .orderBy('max_daily', 'desc')
        .orderBy('current_daily', 'asc')
        .orderBy('max_daily', 'desc')
        .first();
        if ('object' !== typeof(acct) || null === acct || acct.id < 1) {
            return false;
        }
        const proxy = await acct.getRelated('proxy');
        if ('object' !== typeof(proxy) || null === proxy || proxy.id < 1) {
            return false;
        }
        return {
            account: acct,
            proxy,
        }
    }

    _getEmailNameFromLead(lead) {
        let name = '';
        const parts = new Set();
        if ('string' === typeof(lead.fname) && lead.fname.length > 0) {
            parts.add(lead.fname);
        }
        if ('string' === typeof(lead.lname) && lead.lname.length > 0) {
            parts.add(lead.lname);
        }
        if (parts.size > 0) {
            name = [...parts].join(' ');
        }
        else {
            name = lead.email.value;
        }
        return name;
    }

    async _fetchRecordsAsAndRunCallback(job, callback, onIteration) {
        const exporter = use('exporter');
        let {scroll, total, leads} = await exporter._getInitialQueryResults(job);
        const iterations = Math.ceil(total / exporter.maxPerPull);
        job.total_rows = total;
        await cfe(leads, exporter.chunkSize, async ({value}) => {
            if ('function' === typeof(callback)) {
                callback(value);
            }
        }, async () => {
            if ('function' === typeof(onIteration)) {
                onIteration();
            }
        });
        if (scroll && iterations > 1) {
            for (let i = 0; i < (iterations); i++) {
                console.log(`Working on scrolling iteration ${i} of ${iterations - 1}`);
                const results = await exporter._getScrolledQueryResults(scroll);
                if (results.scroll) {
                    scroll = results.scroll;
                }
                await cfe(results.leads, exporter.chunkSize, async ({value}) => {
                    if ('function' === typeof(callback)) {
                        callback(value);
                    }
                }, async () => {
                    if ('function' === typeof(onIteration)) {
                        onIteration();
                    }
                });
            }
        }
    }

    async _getManualRecipientsAsArray(recipients) {
        const rec = new Set();
        if ('string' === typeof(recipients) && recipients.length > 0) {
            const opts = recipients.split(',');
            for (let i = 0; i < opts.length; i++) {
                const opt = opts[i];
                const info = importer._getPhoneInfoWithoutIso(opt);
                if (info.valid) {
                    const lead = await importer.getDuplicateId('phone', info.value, true, true);
                    rec.add(lead);
                }
            }
        }
        return [...rec];
    }

    async _getManualEmailRecipientsAsArray(recipients) {
        const rec = new Set();
        if ('string' === typeof(recipients) && recipients.length > 0) {
            const opts = recipients.split(',');
            for (let i = 0; i < opts.length; i++) {
                const opt = opts[i].toLowerCase();
                const lead = await importer.getDuplicateId('email', opt, true, true);
                rec.add(lead);
            }
        }
        return [...rec];
    }

    _fixSenderId(text) {
        const changeCase = require('change-case');
        if ('string' !== typeof(text)) {
            text = '';
        }
        if (text.length > 11) {
            text = changeCase.pascalCase(text);
        }
        if (text.length > 11) {
            text = text.substring(0, 11);
        }
        return text;
    }

    _renderText(template, lead) {
        const Mustache = require('mustache');
        return Mustache.render(template, lead);
    }

    _getSendAtForLead(sendAtConfig, lead) {
        const moment = require('moment-timezone');
        let t = moment(sendAtConfig.time);
        if (t.isBefore(moment())) {
            t = moment();
        }
        return t.format('YYYY-MM-DD HH:mm:ss');
    }
}

module.exports = MessageQueue;