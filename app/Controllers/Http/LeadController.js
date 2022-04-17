'use strict'

const { validate } = use('Validator');
const moment = require('moment-timezone');
const { getName } = require('country-list');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const Drive = use('Drive');
const XLSX = require('xlsx');
const ExportJob = use('App/Models/ExportJob');
const Config = use('Config');
const md5 = require('md5');
const Helpers = use('Helpers');
const mkdirp = require('mkdirp');
const {push} = require('../../Services/push');
require('newrelic');
const sleep = use('sleep');

class LeadController {
    async list({response, request}) {
        const {client} = require('../../Services/elasticsearch');
        const advanced = request.input('advanced');
        const query = {
            index: 'leads',
            scroll: '1h',
            size: 10,
            _source: true,
        }
        if (true === advanced && 'object' === typeof(request.input('query'))) {
            query.body = request.input('query');
        } else if (null !== request.input('query')) {
            query.q = request.input('query');
        }
        try {
            const result = await client.search(query);
            //console.log(JSON.stringify(result, null, 2));
            return response.api(200, result.body);
        } catch (error) {
            // console.warn(error);
            return response.api(500, null, [{message: error.toString()}]);
        }
        return response.api(418, null, [{
            message: "Debugging"
        }]);
    }

    async getLead({response, params}) {
        const client = use('elasticsearch');
        try {
            const {body} = await client.get({
                id: params.id,
                index: 'leads',
            })
            body._source._id = body._id;
            return response.api(200, body._source);
        } catch (error) {
            // console.warn(error);
            return response.api(500, null, [{message: error.toString()}]);
        }
    }

    async scrollingList({response, request}) {
        const rules = {
            scroll: 'required|string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        const {client} = require('../../Services/elasticsearch');
        const scroll = request.input('scroll');
        const query = {
            scroll_id: scroll,
            scroll: '1h',
        }
        try {
            const result = await client.scroll(query);
            //console.log(JSON.stringify(result, null, 2));
            return response.api(200, result.body);
        } catch (error) {
            // console.warn(error);
            return response.api(500, null, [{message: error.toString()}]);
        }
        return response.api(418, null, [{
            message: "Debugging"
        }]);
    }

    async previewExport({response, request}) {
        const rules = {
            columns: 'required',
            leads: 'required',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        const leads = request.input('leads');
        const columns = request.input('columns');
        const results = await this.makearrayFromElasticsearchLeadList(columns, leads, request.input('type'));
        return response.api(200, results);
    }

    async startExport({response, request}) {
        const fileFormats = Config.get('exporting.formats');
        const rules = {
            columns: 'required',
            fileFormat: 'required|string|in:csv,xlsx,xlsm,xlsb,biff8,biff5,biff2,xlml,ods,fods,txt,sylk,html,dif,dbf,rtf,prn,eth,api',
            fileName: 'required|string',
            filter: 'string',
            isAdvancedFilter: 'required|boolean',
            limit: 'integer',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        let filter = request.input('filter');
        if (null === filter) {
            filter = JSON.stringify({
                query: {
                    match_all: {}
                }
            })
        }
        if (true === request.input('isAdvancedFilter') || null === request.input('filter')) {
            try {
                filter = JSON.stringify(JSON.parse(filter));
            } catch (error) {
                return response.api(400, null, [{message: error.toString()}]);
            }
        }
        const e = new ExportJob;
        e.status = 'new';
        e.total_rows = 0;
        e.processed_rows = 0;
        e.filter_query = filter;
        e.filter_is_advanced = (true === request.input('isAdvancedFilter') || null === request.input('filter'));
        e.export_format = request.input('fileFormat');
        e.export_columns = request.input('columns');
        e.limit = (isNaN(request.input('limit'))) ? -1 : parseInt(request.input('limit'));
        if ('api' === request.input('fileFormat')) {
            e.drive = 'api';
            e.drive_name = request.input('api');
            e.drive_path = `api.${e.drive_name}`;
            e.export_name = request.input('fileName');
        } else {
            e.drive = Config.get('drive.disk');
            e.drive_name = md5(`${request.input('fileName')} ${Math.random()}`) + fileFormats[request.input('fileFormat')].extension;
            e.drive_path = `exports/${e.drive_name}`;
            e.export_name = `${request.input('fileName')}${fileFormats[request.input('fileFormat')].extension}`;
        }
        try {
            await e.save();
            this.spawnForkForJob(e.id);
            return response.api(200, e);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async getFileTypeMax({response, request}) {
        const fileFormats = Config.get('exporting.formats');
        const rules = {
            type: `required|string|in:${Object.keys(fileFormats).join(',')}`,
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        return response.api(200, fileFormats[request.input('type')].maxExport);
    }

    async makearrayFromElasticsearchLeadList(columns, leads, inputType) {
        const results = [];
        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i]._source;
            lead._id = leads[i]._id;
            const row = {};
            if ('undefined' === typeof(inputType) || ['api'].indexOf(inputType) === -1) {
                for (let order in columns) {
                    const column = columns[order];
                    if (null === column.leadField) {
                        continue;
                    }
                    let value;
                    if (column.leadField.includes('.')) {
                        try {
                            value = column.leadField.split('.').reduce((o,i)=>o[i], lead);
                        } catch (error) {
                            value = null;
                        }
                    } else {
                        value = lead[column.leadField];
                    }
                    if ('undefined' === typeof(value)) {
                        value = null;
                    }
                    if (null !== value && ['date', 'time', 'datetime'].indexOf(column.leadFieldType) > -1) {
                        value = moment(value).format(column.format);
                    }
                    else if (null !== value && ['country'].indexOf(column.leadFieldType) > -1) {
                        if ('name' === column.format) {
                            value = getName(value);
                        }
                    }
                    else if (null !== value && ['phone'].indexOf(column.leadFieldType) > -1) {
                        const valid = column.leadField.replace('value', 'valid').split('.').reduce((o,i)=>o[i], lead);
                        if (valid) {
                            const iso = column.leadField.replace('value', 'iso').split('.').reduce((o,i)=>o[i], lead);
                            try {
                                const number = phoneUtil.parseAndKeepRawInput(`${value}`, iso);
                                switch(column.format) {
                                    case 'raw':
                                        break;
    
                                    case 'E164':
                                        value = phoneUtil.format(number, PNF.E164);
                                        break;
    
                                    case 'INTERNATIONAL':
                                        value = phoneUtil.format(number, PNF.INTERNATIONAL);
                                        break;
    
                                    case 'NATIONAL':
                                        value = phoneUtil.format(number, PNF.NATIONAL);
                                        break;
    
                                    case 'RFC3966':
                                        value = phoneUtil.format(number, PNF.RFC3966);
                                        break;
                                }
                            } catch (error) {
                                value = null;
                            }
                        } else {
                            value = null;
                        }
                    }
                    row[order] = value;
                }
            }
            else if ('api' === inputType) {
                for(let fieldname in columns) {
                    const info = columns[fieldname];
                    let value;
                    if (null === info.leadField) {
                        continue;
                    }
                    if (info.leadField.includes('.')) {
                        try {
                            value = info.leadField.split('.').reduce((o,i)=>o[i], lead);
                        } catch (error) {
                            value = info.default;
                        }
                    } else {
                        value = lead[info.leadField];
                    }
                    if ('undefined' === typeof(value)) {
                        value = info.default;
                    }
                    if (null !== value && ['date', 'time', 'datetime'].indexOf(info.leadFieldType) > -1) {
                        value = moment(value).format(info.leadFieldFormat);
                    }
                    else if (null !== value && ['country'].indexOf(info.leadFieldType) > -1) {
                        if ('name' === info.leadFieldFormat) {
                            value = getName(value);
                        }
                    }
                    else if (null !== value && ['phone'].indexOf(info.leadFieldType) > -1) {
                        const valid = info.leadField.replace('value', 'valid').split('.').reduce((o,i)=>o[i], lead);
                        if (valid) {
                            const iso = info.leadField.replace('value', 'iso').split('.').reduce((o,i)=>o[i], lead);
                            try {
                                const number = phoneUtil.parseAndKeepRawInput(`${value}`, iso);
                                switch(info.leadFieldFormat) {
                                    case 'raw':
                                        break;
    
                                    case 'E164':
                                        value = phoneUtil.format(number, PNF.E164);
                                        break;
    
                                    case 'INTERNATIONAL':
                                        value = phoneUtil.format(number, PNF.INTERNATIONAL);
                                        break;
    
                                    case 'NATIONAL':
                                        value = phoneUtil.format(number, PNF.NATIONAL);
                                        break;
    
                                    case 'RFC3966':
                                        value = phoneUtil.format(number, PNF.RFC3966);
                                        break;
                                }
                            } catch (error) {
                                value = info.default;
                            }
                        } else {
                            value = info.default;
                        }
                    }
                    row[fieldname] = value;
                }
            }
            results.push(row);
        }
        return results;
    }

    async spawnForkForJob(id) {
        const {enqueue} = require('../../Services/queue');
        enqueue('export', id);
    }

    async processExport(e) {
        const exporter = use('exporter');
        await exporter.process(e, async () => {
            await sleep(1000);
            process.exit(); 
        });
    }

    async restartExport({request, response, params}) {
        try {
            const e = await ExportJob.findOrFail(params.id);
            e.status = 'new';
            e.total_rows = 0;
            e.processed_rows = 0;
            await e.save();
            //this.processExport(e);
            this.spawnForkForJob(e.id);
            return response.api(200, e);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async listExports({request, response}) {
        const query = ExportJob.query()
        if ('object' === typeof(request.input('search')) && null !== request.input('search')) {
            const search = request.input('search');
            if ('undefined' !== typeof(search.value) && search.value.length > 0) {
                query.where('export_name', 'like', search.value);
            }
        }
        let start = request.input('start');
        let length = request.input('length');
        const columns = request.input('columns');
        const order = request.input('order');
        if (Array.isArray(order)) {
            for (let i = 0; i < order.length; i++) {
                const orderer = order[i];
                const column = columns[orderer.column];
                query.orderBy(column.name, orderer.dir);
            }
        }
        if ('undefined' === typeof(start) || null === start || parseInt(start) < 0) {
            start = 0;
        }
        if ('undefined' === typeof(length) || null === length || parseInt(length) < 10) {
            length = 10;
        }
        start ++;
        const startPage = Math.ceil(start / length);
        const paginatedResults = await query.paginate(startPage, length);
        const rows = [];
        for (let i = 0; i < paginatedResults.rows.length; i++) {
            const row = paginatedResults.rows[i];
            rows.push([row.id, row.export_name, row.status, row.total_rows, row.processed_rows, row.created_at]);
        }
        return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
    }

    async listApiExports({request, response}) {
        const query = ExportJob.query().where('drive', 'api');
        try {
            const results = await query.fetch();
            return response.api(200, results.rows);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async downloadExport({response, params}) {
        try {
            const e = await ExportJob.findOrFail(params.id);
            const contents = await Drive.disk(e.drive).get(e.drive_path);
            const downloadPath = `downloads/${md5(Math.random())}-${e.drive_name}`;
            const saved = await Drive.disk('local').put(downloadPath, contents);
            if (!saved) {
                return response.redirect(`/#/exports/${params.id}`, false);    
            }
            response.attachment(
                Helpers.tmpPath(downloadPath),
                e.export_name
              )
            await Drive.delete(downloadPath);
        } catch (error) {
            // console.warn(error);
            return response.redirect(`/#/exports/${params.id}`, false);
        }
        //return response.api(418, null, [{
        //    message: "Debugging Me!"
        //}]);
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
}

module.exports = LeadController
