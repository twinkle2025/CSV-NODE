'use strict'

const { validate, sanitize, sanitizor } = use('Validator');
const moment = require('moment-timezone');
const Notifier = use('Notifier');
const client = use('elasticsearch');
require('newrelic');

class ConversionController {
    async captureHasOffers({request, response}) {
        const rules = {
            type: 'required|string|in:click,subscription,registration,ftd,deposit,unsubscribe,call',
            email: 'required_when:phone,null|email',
            phone: 'required_when:email,null|string',
            network_id: 'required|string',
            transaction_id: 'required|string',
            offer_id: 'required|integer',
            affiliate_id: 'required|integer',
            advertiser_id: 'required|integer',
            tags: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            type: 'escape',
            email: 'normalize_email',
            phone: 'phoneNumber',
            network_id: 'escape',
            transaction_id: 'escape',
            offer_id: 'to_int',
            affiliate_id: 'to_int',
            advertiser_id: 'to_int',
        });
        const {status, feedback, errors} = await this._captureConversion(req.email, req.phone, {
            type: req.type,
            date: moment(),
            network: req.network_id,
            funnel: req.offer_id,
            affiliate: req.affiliate_id,
            broker: req.advertiser_id,
            transaction: req.transaction_id,
        }, req.tags);
        return response.api(status, feedback, errors);
    }

    async captureGeneral({request, response}) {
        const rules = {
            type: 'required|string|in:click,subscription,registration,ftd,deposit,unsubscribe,call',
            email: 'required_when:phone,null|email',
            phone: 'required_when:email,null|string',
            disposition: 'required_when:type,call|string',
            network: 'string',
            transaction: 'string',
            offer: 'string',
            affiliate: 'string',
            advertiser: 'required|string',
            tags: 'string',
            click_id: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            type: 'escape',
            email: 'normalize_email',
            phone: 'phoneNumber',
            network: 'escape',
            transaction: 'escape',
            offer: 'escape',
            affiliate: 'escape',
            advertiser: 'escape',
            disposition: 'escape',
            click_id: 'escape',
        });
        const {status, feedback, errors} = await this._captureConversion(req.email, req.phone, {
            type: req.type,
            date: moment(),
            network: req.network,
            funnel: req.offer,
            affiliate: req.affiliate,
            broker: req.advertiser,
            transaction: req.transaction,
            disposition: req.disposition,
            click_id: req.click_id,
        }, req.tags);
        return response.api(status, feedback, errors);
    }

    async pushNoteToPanda({request, response}) {
        const rules = {
            panda_api_id: 'required|integer',
            panda_email: 'required|email',
            panda_type: 'required|in:lead,client',
            lead_id: 'required_when:click_id,null|string',
            click_id: 'required_when:lead_id,null|string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            panda_api_id: 'to_int',
            panda_email: 'normalize_email',
            panda_type: 'escape',
            lead_id: 'escape',
            click_id: 'escape',
        });
        this._pushNoteToPanda(req);
        return response.api(201, req);
    }

    async _pushNoteToPanda(req) {
        const qs = require('qs');
        let click;
        let lead;
        let lead_id;
        let note = '';
        try {
            if (req.click_id) {
                click = await this._getClickById(req.click_id);
                if (click.lead_id) {
                    lead = await this._getLeadById(click.lead_id);
                    lead_id = click.lead_id;
                }
            }
            if ((typeof(click) === 'object' && null !== click && !click.lead_id) || (req.lead_id)) {
                lead = await this._getLeadById(req.lead_id);
                lead_id = req.lead_id;
            }
            if (click) {
                note += `Click ID: ${req.click_id}` + "\n";
                if (click.ip.value) {
                    note += `IP Address: ${click.ip.value}` + "\n";
                }
                if (click.ua.value) {
                    note += `Device: ${click.ua.value}` + "\n";
                }
                if (click.meta.source_id) {
                    note += `Source ID: ${click.meta.source_id}` + "\n";
                }
                if (click.meta.source) {
                    note += `Source: ${click.meta.source}` + "\n";
                }
                if (click.meta.aff_sub_id) {
                    note += `Sub Source ID: ${click.meta.aff_sub_id}` + "\n";
                }
                if (click.meta.aff_sub) {
                    note += `Sub Source: ${click.meta.aff_sub}` + "\n";
                }
                if (click.meta.domain_id) {
                    note += `Domain ID: ${click.meta.domain_id}` + "\n";
                }
                if (click.meta.domain) {
                    note += `URL: https://r.${click.meta.domain}/aff_c?${qs.stringify({
                        offer_id: click.meta.offer_id,
                        aff_id: click.meta.aff_id,
                        url_id: click.meta.url_id,
                        source: click.meta.source,
                        aff_sub: click.meta.aff_sub,
                    })}` + "\n";
                }
            }
            if (lead) {
                let hasFTDd = false;
                note += "\n";
                note += `Bastion Lead ID: ${lead_id}` + "\n";
                if (lead.tags) {
                    note += `Bastion Lead Tags: ${lead.tags.join(', ')}` + "\n";
                }
                if (lead.brokers) {
                    note += `Bastion Lead Brokers: ${lead.brokers.join(', ')}` + "\n";
                }
                if (lead.conversions) {
                    for (let i = 0; i < lead.conversions.length; i++) {
                        const c = lead.conversions[i];
                        if (c.type === 'ftd') {
                            hasFTDd = true;
                        }
                    }
                }
                note += `Bastion FTD Status: ${hasFTDd}` + "\n";
            }
            if (note.length > 0) {
                const ExportApi = use('App/Models/ExportApi');
                const Config = use('Config');
                const api = await ExportApi.findOrFail(req.panda_api_id);
                if (api.service === 'panda') {
                    const service = use('ExportApi/Panda');
                    const a = new service(api);
                    await a.note(req.panda_email, note);
                }
            }
        }
        catch (error) {
            console.warn(error);
        }
    }

    async _getLeadById(id) {
        try {
            const {body} = await client.get({
                index: 'leads',
                id,
            });
            return body._source;
        } catch (error) {
            console.warn(`Failed to get Lead by ID due to error: ${error.toString()}`);
            console.warn(error.body.error);
            return null;
        }
    }

    async _getClickById(id) {
        try {
            const {body} = await client.get({
                index: 'clicks',
                id,
            });
            return body._source;
        } catch (error) {
            console.warn(`Failed to get Click by ID due to error: ${error.toString()}`);
            console.warn(error.body.error);
            return null;
        }
    }

    // cdata: {type, date, network, funnel, affiliate, disposition, broker, amount, currency, transaction}
    async _captureConversion(email, phone, cdata, tags) {
        const importer = use('importer');
        const namableParams = ['network', 'funnel', 'affiliate', 'disposition', 'broker']
        let map = new Map();
        if ('string' === typeof(phone) && phone.length > 0) {
            const pinfo = await importer._getPhoneInfoWithoutIso(phone);
            map.set('phone', pinfo);
        }
        if ('string' === typeof(email) && email.length > 0) {
            const einfo = await importer._formatCell(email, 'email');
            map.set('email', einfo);
        }
        const conversion = {
            type: cdata.type,
            date: cdata.date,
        };
        if ('undefined' !== typeof(cdata.currency)) {
            conversion.currency = cdata.currency;
        }
        if ('undefined' !== typeof(cdata.transaction)) {
            conversion.transaction = cdata.transaction;
        }
        if ('undefined' !== typeof(cdata.click_id)) {
            conversion.click_id = cdata.click_id;
            try {
                const cd = await client.get({
                    id: conversion.click_id,
                    index: 'clicks',
                })
                conversion.click_source = cd.body._source;
            } catch (error) {}
        }
        for (let i = 0; i < namableParams.length; i++) {
            const key = namableParams[i];
            if ('undefined' !== typeof(cdata[key]) && null !== cdata[key]) {
                const val = cdata[key];
                if (isNaN(val)) {
                    conversion[`${key}_name`] = val;
                } else {
                    conversion[key] = val;
                }
            }   
        }
        if (!isNaN(cdata.amount)) {
            conversion.amount = parseFloat(cdata.amount);
        }
        map.set('conversions', [conversion]);
        const ltags = [];
        if ('undefined' !== typeof(tags) && null !== tags) {
            tags.split(',').forEach( (tag) => {
                ltags.push(tag);
            });
        }
        map.set('tags', ltags);
        let saveId;
        let deleteId;
        const duplicateIds = await importer.getExistingLeadId(map);
        if ('string' === typeof(duplicateIds) || 'object' === typeof(duplicateIds)) {
            switch(typeof(duplicateIds)) {
                case 'object':
                    saveId = duplicateIds.phone;
                    if (duplicateIds.phone !== duplicateIds.email) {
                        map = await importer.mergeLeadDetails(map, duplicateIds.email);
                        map = await importer.mergeLeadDetails(map, duplicateIds.phone);
                        deleteId = duplicateIds.email;
                    } else {
                        map = await importer.mergeLeadDetails(map, duplicateIds.phone);
                    }
                    break;

                case 'string':
                    map = await importer.mergeLeadDetails(map, duplicateIds);
                    saveId = duplicateIds;
                    break;
            }
        }
        const {id, is_new, status, feedback, error} = await importer.saveLeadToElasticsearch(map, saveId, deleteId);
        const newText = is_new ? 'new' : 'existing';
        if (null !== id) {
            Notifier.notify('Conversion Received', `A new ${cdata.type} conversion was received for ${newText} lead ${id}`, 'notification');
        }
        if ('undefined' !== typeof(cdata.click_id)) {
            // conversion.click_id = cdata.click_id;
            this.addLeadToClick(cdata.click_id, id);
        }
        return {status: (true === status) ? 200 : 500, feedback, errors: (error) ? [error] : null}
    }

    async addLeadToClick(click_id, lead_id) {
        try {
            await client.update({
                index: 'clicks',
                id: click_id,
                refresh: true,
                retry_on_conflict: 5,
                body: {
                    doc: {
                        lead_id
                    }
                }
            });
            console.log(`Added Lead ID: ${lead_id} to Click: ${click_id}`);
        } catch (error) {
            console.warn(`Failed to save association between click and lead to Elasticsearch due to error: ${error.toString()}`);
            console.warn(error.body.error);
        }
    }

    async capturePanda({request, response, params}) {
        const rules = {
            email: 'required|email',
            brand: 'string',
            account: 'required|string'
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, request.all(), validation.messages());
        }
        const req = sanitize(request.all(), {
            brand: 'escape',
            email: 'normalize_email',
            account: 'escape',
        });
        const {status, feedback, errors} = await this._captureConversion(req.email, req.phone, {
            type: params.type,
            date: moment(),
            broker: req.brand,
            transaction: req.account,
        }, params.tags);
        return response.api(status, feedback, errors);
    }
}

module.exports = ConversionController
