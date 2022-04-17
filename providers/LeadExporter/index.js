'use strict'

const newrelic = require('newrelic');
const client = use('elasticsearch');
const chunkedForEach = use('chunkedForEach');
const moment = require('moment-timezone');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const { getName } = require('country-list');
const Drive = use('Drive');
const Notifier = use('Notifier');
const sleep = use('sleep');

class LeadExporter {
    constructor() {
        this.maxPerPull = 5000;
        this.chunkSize = 100;
        this.originalChunkSize = 100;
    }

    async process(job, onComplete) {
        if ('function' !== typeof(onComplete)) {
            onComplete = async () => {};
        }
        job.status = 'starting';
        await this._saveModel(job);
        switch (job.export_format) {
            case 'csv':
                await this._handleWriteLineToDestinationExport(job, onComplete);
                break;

            case 'txt':
                await this._handleWriteLineToDestinationExport(job, onComplete);
                break;

            case 'api':
                await this._handleWriteLineToDestinationExport(job, onComplete);
                break;
        
            default:
                await this._handleWriteFileInBulkExport(job, onComplete);
                break;
        }
    }

    async _handleWriteLineToDestinationExport(job, onComplete) {
        let a;
        let stringifier;
        const currentPath = `tmp-exports/${job.drive_name}`;
        if ('api' === job.drive) {
            this.chunkSize = 1;
            const ExportApi = use('App/Models/ExportApi');
            let api;
            let service;
            try {
                api = await ExportApi.findOrFail(job.drive_name);
            } catch (error) {
                job.status = 'failed';
                await this._saveModel(job);
                process.exit();
            }
            switch(api.service) {
                case 'test':
                    service = use('ExportApi/Test');
                    break;

                case 'panda':
                    service = use('ExportApi/Panda');
                    break;

                case 'atompark':
                    service = use('ExportApi/Atompark');
                    break;

                default:
                    console.log(`Unknown API service ${api.service}`);
                    e.status = 'failed';
                    await this._saveModel(job);
                    process.exit();
            }
            a = new service(api);
        }
        else {
            this.chunkSize = this.originalChunkSize;
            await Drive.delete(currentPath);
            const stringify = require('csv-stringify');
            stringifier = stringify({
                delimiter: ','
            });
            stringifier.on('readable', async () => {
                let row;
                while (row = stringifier.read()) {
                    await Drive.append(currentPath, row);
                }
            });
            stringifier.on('error', (err) => {
                console.warn(`An error occured while writing to csv stringifier: ${err.message}`);
                console.warn(err);
                newrelic.noticeError(err);
            });
            const firstRow = [];
            for (let i in job.export_columns) {
                const column = job.export_columns[i];
                firstRow.push(column.columnName);
            }
            stringifier.write(firstRow);
        }
        await this._fetchRecordsAsAndRunCallback(job, async (lead) => {
            const formatted = this._formatLead(lead._source, job.export_columns, job.drive);
            if ('api' === job.drive) {
                await a.exportLeads(
                    [formatted], // array of leads to import
                    async (lead) => {
                        job.processed_rows ++;
                    },
                    async (lead, error) => { // on lead error
                        job.processed_rows ++;
                        console.warn(`Error Exporting Lead to API: ${error.toString()}`);
                        console.warn(error);
                        newrelic.noticeError(error);
                    },
                    async (error) => { // on failure
                        console.warn(`Error Exporting Leads to API: ${error.toString()}`);
                        console.warn(error);
                        newrelic.noticeError(error);
                    },
                    async () => {
                        await this._saveModel(job);
                    }
                )
            } else {
                if (job.limit < 0 || job.processed_rows < job.limit) {
                    stringifier.write(Object.values(formatted));
                    job.processed_rows ++;
                }
            }
        }, async () => {
            if ('api' === job.drive) {
                job.status = 'exporting to api';
            } else {
                job.status = 'writing file';
            }
            await this._saveModel(job);
        });
        if ('api' === job.drive) {
            job.status = 'completed';
            await this._saveModel(job);
            await onComplete();
        }
        else {
            stringifier.end();
            try {
                if ('local' === job.drive) {
                    if (await Drive.disk('local').exists(job.drive_path)) {
                        await Drive.disk('local').delete(job.drive_path);
                    }
                    const moved = await Drive.disk('local').move(currentPath, job.drive_path);
                    if (true === moved) {
                        job.processed_rows = job.total_rows;
                        job.status = 'ready for download';
                        await this._saveModel(job);
                        Notifier.push('Export Finished',  `Export Job ${job.id} is ready for download`);
                        await onComplete();
                    } else {
                        job.status = 'failed to save file';
                        await this._saveModel(job);
                        Notifier.push('Export Failed',  `Export Job ${job.id} failed`);
                        await onComplete();
                    }
                } else {
                    const currentFile = await Drive.get(currentPath);
                    if (await Drive.disk('s3').exists(job.drive_path)) {
                        await Drive.disk('s3').delete(job.drive_path);
                    }
                    const moved = await Drive.disk('s3').put(job.drive_path, currentFile);
                    if (true === moved) {
                        Drive.disk('local').delete(currentPath);
                        job.processed_rows = job.total_rows;
                        job.status = 'ready for download';
                        await this._saveModel(job);
                        Notifier.push('Export Finished',  `Export Job ${job.id} is ready for download`);
                        await onComplete();
                    } else {
                        job.status = 'failed to save file';
                        await this._saveModel(job);
                        Notifier.push('Export Failed',  `Export Job ${job.id} failed`);      
                        await onComplete();
                    }
                }
            } catch (error) {
                console.warn(`Failed to save file for job ${job.id} due to error: ${error.toString()}`);
                console.warn(error);
                newrelic.noticeError(error);
            }
        }
    }

    async _handleWriteFileInBulkExport(job, onComplete) {
        const XLSX = require('xlsx');
        const mkdirp = require('mkdirp');
        const Helpers = use('Helpers');
        await mkdirp(Helpers.tmpPath(`tmp-exports`));
        const tmpfile = Helpers.tmpPath(`tmp-exports/${job.drive_name}`);
        const aoa = await this._fetchRecordsAsArrayOfArrays(job);
        const firstRow = [];
        for (let i in job.export_columns) {
            const column = job.export_columns[i];
            firstRow.push(column.columnName);
        }
        const workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([firstRow]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Sheet 1');
        await chunkedForEach(aoa, this.chunkSize, async ({value}) => {
            XLSX.utils.sheet_add_aoa(ws, [value], {origin: -1});
            try {
                await XLSX.writeFile(workbook, tmpfile, {
                    bookType: job.export_format,
                });
                job.processed_rows ++;
            } catch (error) {
                console.warn(`Failed to save file for export job ${job.id} due to error: ${error.toString()}`);
                console.warn(error);
                newrelic.noticeError(error);
                job.status = 'failed';
                await this._saveModel(job);
                process.exit();
            }
        }, async () => {
            job.status = 'writing file';
            await this._saveModel(job);
        })
        try {
            if ('local' === job.drive) {
                if (await Drive.disk('local').exists(job.drive_path)) {
                    await Drive.disk('local').delete(job.drive_path);
                }
                const moved = await Drive.disk('local').move(tmpfile, job.drive_path);
                if (true === moved) {
                    job.processed_rows = job.total_rows;
                    job.status = 'ready for download';
                    await this._saveModel(job);
                    Notifier.push('Export Finished',  `Export Job ${job.id} is ready for download`);
                    await onComplete();
                } else {
                    job.status = 'failed to save file';
                    await this._saveModel(job);
                    Notifier.push('Export Failed',  `Export Job ${job.id} failed`);
                    await onComplete();
                }
            } else {
                const currentFile = await Drive.get(tmpfile);
                if (await Drive.disk('s3').exists(job.drive_path)) {
                    await Drive.disk('s3').delete(job.drive_path);
                }
                const moved = await Drive.disk('s3').put(job.drive_path, currentFile);
                if (true === moved) {
                    Drive.disk('local').delete(tmpfile);
                    job.processed_rows = job.total_rows;
                    job.status = 'ready for download';
                    await this._saveModel(job);
                    Notifier.push('Export Finished',  `Export Job ${job.id} is ready for download`);
                    await onComplete();
                } else {
                    job.status = 'failed to save file';
                    await this._saveModel(job);
                    Notifier.push('Export Failed',  `Export Job ${job.id} failed`);      
                    await onComplete();
                }
            }
        } catch (error) {
            console.warn(`Failed to save file for job ${job.id} due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
        }

    }

    async _fetchRecordsAsArrayOfArrays(job) {
        const array = []
        job.status = 'loading records';
        await this._fetchRecordsAsAndRunCallback(job, async (lead) => {
            lead._source._id = lead._id;
            if (job.limit < 0 || array.length < job.limit) {
                array.push(Object.values(this._formatLead(lead._source, job.export_columns, job.drive)));
            }
        }, async () => {
            await this._saveModel(job);
        });
        return array;
    }

    _formatLead(lead, columns, destination) {
        if ('undefined' === typeof(destination) || ['api'].indexOf(destination) === -1) {
            return this._formatLeadForFile(lead, columns);
        } else {
            return this._formatLeadForAPI(lead, columns);
        }
    }

    _formatLeadForFile(lead, columns) {
        const row = {};
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
        return row;
    }

    _formatLeadForAPI(lead, columns) {
        const row = {};
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
        return row;
    }

    async _fetchRecordsAsAndRunCallback(job, callback, onIteration) {
        job.status = 'loading records';
        await this._saveModel(job);
        let {scroll, total, leads} = await this._getInitialQueryResults(job);
        if (0 === total) {
            job.status = 'failed';
            await this._saveModel(job);
            process.exit();
        }
        total = (job.limit > -1 && total >= job.limit) ? job.limit : total;
        const iterations = Math.ceil(total / this.maxPerPull);
        job.total_rows = total;
        await this._saveModel(job);
        await chunkedForEach(leads, this.chunkSize, async ({value}) => {
            value._source._id = value._id;
            if ('function' === typeof(callback)) {
                await callback(value);
            }
        }, async () => {
            if ('function' === typeof(onIteration)) {
                await onIteration();
            }
        });
        if (scroll && iterations > 1) {
            for (let i = 0; i < (iterations); i++) {
                console.log(`Working on scrolling iteration ${i} of ${iterations - 1}`);
                const results = await this._getScrolledQueryResults(scroll);
                if (results.scroll) {
                    scroll = results.scroll;
                }
                await chunkedForEach(results.leads, this.chunkSize, async ({value}) => {
                    value._source._id = value._id;
                    if ('function' === typeof(callback)) {
                        await callback(value);
                    }
                }, async () => {
                    if ('function' === typeof(onIteration)) {
                        await onIteration();
                    }
                });
            }
        }
    }

    async _getInitialQueryResults(job) {
        const ret = {
            scroll: null,
            total: 0,
            leads: [],
        }
        const query = {
            index: 'leads',
            scroll: '1m',
            size: this.maxPerPull,
            _source: true,
        }
        if (true === job.filter_is_advanced || 1 === job.filter_is_advanced) {
            query.body = JSON.parse(job.filter_query);
        } else {
            query.q = job.filter_query;
        }
        try {
            const {body} = await client.search(query);
            ret.total = body.hits.total.value;
            ret.scroll = body['_scroll_id'];
            ret.leads = body.hits.hits;
        } catch (error) {
            console.warn(`Failed to get initial query results for export ${job.id} due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
        }
        return ret;
    }

    async _getScrolledQueryResults(scroll) {
        const query = {
            scroll_id: scroll,
            scroll: '1m',
        }
        const ret = {
            scroll: null,
            leads: [],
        }
        try {
            const {body} = await client.scroll(query);
            ret.scroll = body['_scroll_id'];
            ret.leads = body.hits.hits;
        } catch (error) {
            console.warn(`Failed to get scrolled query results for export due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
        }
        return ret;
    }

    async _saveModel(model) {
        try {
            return await model.save();
        } catch (error) {
            console.warn(`Failed to save Model due to error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
            return false;
        }
    }
}

module.exports = LeadExporter;