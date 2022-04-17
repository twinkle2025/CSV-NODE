'use strict'
const { validate } = use('Validator');
const Helpers = use('Helpers');
const Config = use('Config');
const File = use('App/Models/File');
const ImportSetting = use('App/Models/ImportSetting');
const ImportJob = use('App/Models/ImportJob');
const md5 = require('md5');
const Drive = use('Drive');
const Notifier = use('Notifier');
const newrelic = require('newrelic');
const importer = use('importer');
const sleep = use('sleep');

class ListController {
    async upload({response, request}) {
        const validationOptions = {
            types: [
                'text',
                'csv',
                'plain',
                'vnd.ms-excel',
                'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            size: '100mb',
            extnames: ['csv', 'txt', 'xls', 'xlsx']
        }
        const file = request.file('file', validationOptions)

        await file.move(Helpers.tmpPath('uploads'), {
            //overwrite: false,
            overwrite: true,
        })
        if (file.moved()) {
            // now we need to deal with the file
            const fileInfo = file.toJSON();
            const f = new File;
            f.name = fileInfo.fileName;
            f.drive = Config.get('drive.disk');
            f.key = md5(`${fileInfo.fileName} ${Math.random()}`);
            f.path = `lists/${f.key}.${fileInfo.extname}`;
            const currentPath = `uploads/${f.name}`;
            if ('local' === f.drive) {
                const moved = await Drive.disk('local').move(currentPath, f.path);
                if (true === moved) {
                    f.save();
                    response.api(201);
                } else {
                    return response.api(400, null, [{
                        message: "Unable to save file",
                    }]);        
                }
            } else {
                const currentFile = await Drive.get(currentPath);
                const moved = await Drive.disk('s3').put(f.path, currentFile);
                if (true === moved) {
                    f.save();
                    response.api(201);
                    Drive.disk('local').delete(currentPath);
                } else {
                    return response.api(400, null, [{
                        message: "Unable to save file",
                    }]);        
                }
            }
            // at this point, we have all of the information we need in order to move the file
        } else {
            return response.api(400, null, [file.error()]);
        }
    }

    async list({response, request}) {
        const query = File.query().with('setting').where(function() {
            this.whereDoesntHave('jobs', (builder) => {
                builder.where('status', 'completed');
            })
        });
        if ('object' === typeof(request.input('search')) && null !== request.input('search')) {
            const search = request.input('search');
            if ('undefined' !== typeof(search.value) && search.value.length > 0) {
                query.where('name', 'like', `%${search.value}%`);
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
            rows.push([row.id, row.name, row.created_at, (null !== row.getRelated('setting'))]);
        }
        return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
    }

    async listWithSettings({response, request}) {
        const query = File.query().with('setting').has('setting');
        try {
            const results = await query.fetch();
            return response.api(200, results.rows);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async get({response, request, params}) {
        try {
            const file = await File.findOrFail(params.id);
            await file.loadMany(['jobs', 'setting']);
            return response.api(200, file);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async delete({response, request, params}) {
        try {
            const file = await File.findOrFail(params.id);
            await file.loadMany(['jobs', 'setting']);
            // delete the physical file
            await Drive.disk(file.drive).delete(file.path);
            // delete any related jobs
            await file.jobs().delete();
            // delete any related settings
            await file.setting().delete();
            // delete the DB row
            await file.delete();
            return response.api(200);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
        return response.api(400, null, [{message: 'Debugging'}]);
    }

    async preview({response, request, params}) {
        const rules = {
            column_delimiter: 'string',
            column_quotation: 'required|string',
            header_row: 'required|number|min:0',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        let column_settings = request.input('column_settings');
        let count = request.input('count');
        if (!isNaN(count)) {
            count = parseInt(count);
        } else {
            count = 11;
        }
        try {
            const file = await File.findOrFail(params.id);
            let body;
            if ('csv' === request.input('filetype') && 'local' === file.drive) {
                body = await this._getCSVFilePreview(file, request, column_settings, count);
            } else {
                body = await this._getExcelFilePreview(file, request, column_settings, count);;
            }
            return response.api(200, {
                column_settings,
                rows: body,
            });
        } catch (error) {
            console.warn(error);
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async _getCSVFilePreview(file, request, column_settings, count) {
        const fb = [];
        const rows = new Set();
        const stream = await importer.getSpreadsheetAsStream(file.path, request.input('column_delimiter'), 1, count);
        const promise = new Promise((resolve, reject) => {
            stream.on('data', async (row) => {
                const r = new Map();
                for (let i = 0; i < row.length; i++) {
                    const cell = row[i];
                    r.set(i, cell);
                }
                rows.add(r);
            });

            stream.on('error', (error) => {
                reject(error);
            });

            stream.on('end', async() => {
                resolve();
            });
        });
        await promise;
        if (Object.keys(column_settings).length === 0 && rows.size > 0) {
            const iterator = rows.values();
            const first_row = iterator.next().value;
            first_row.forEach( (val, index, map) => {
                column_settings[`${index}`] = {
                    type: 'general',
                    name: '',
                    options: {
                        default: '',
                    }
                }
            })
        }
        rows.forEach((row) => {
            const promise = importer.makeLeadObjectFromMap(row, column_settings);
            fb.push(promise);
        });
        const body = await Promise.all(fb);
        return body
    }

    async _getExcelFilePreview(file, request, column_settings, count) {
        const fb = [];
        const rows = await importer.getSpreadsheetAsSet(request.input('filetype'), file.drive, file.path, request.input('column_delimiter'), count);
        if (Object.keys(column_settings).length === 0 && rows.size > 0) {
            const iterator = rows.values();
            const first_row = iterator.next().value;
            first_row.forEach( (val, index, map) => {
                column_settings[`${index}`] = {
                    type: 'general',
                    name: '',
                    options: {
                        default: '',
                    }
                }
            })
        }
        rows.forEach((row) => {
            const promise = importer.makeLeadObjectFromMap(row, column_settings);
            fb.push(promise);
        });
        const body = await Promise.all(fb);
        return body
    }

    async start({response, params}) {
        try {
            const file = await File.findOrFail(params.id);
            await file.loadMany(['jobs', 'setting']);
            const setting = file.getRelated('setting');
            if (null === setting) {
                return response.api(400, null, [{message: 'You have not setup the import settings for this file yet.'}]);    
            }
            const existingQuery = ImportJob.query().where((builder) =>
                builder.where('file_id', params.id).whereNotIn('status', ['cancelled', 'completed'])
            );
            const existing = await existingQuery.fetch();
            if (existing.rows.length > 0) {
                return response.api(400, null, [{ message: 'This file is already being imported on a different process' }]);
            }
            const job = new ImportJob;
            job.status = 'new';
            job.total_rows = 0;
            job.processed_rows = 0;
            job.valid_rows = 0;
            job.duplicate_rows = 0;
            job.invalid_rows = 0;
            await file.jobs().save(job);
            //this.startJobProcessing(file, setting, job);
            this.spawnForkForJob(job.id);
            return response.api(200, file);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
    }

    async saveSettings({response, request, params}) {
        const rules = {
            column_delimiter: 'string',
            column_quotation: 'required|string',
            filetype: 'required|string|in:csv,excel',
            column_settings: 'required|object',
            conversion_settings: 'required|object',
            header_row: 'required|number|min:0',
            tags: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        // now we need to make sure that we have at least an `email` or a `phone` field
        const column_settings = request.input('column_settings');
        let has_email = false;
        let has_phone = false;
        for (let columnId in column_settings) {
            const column = column_settings[columnId];
            if ('phone' === column.name) {
                has_phone = true;
            }
            if ('email' === column.name) {
                has_email = true;
            }
        }
        if (false === has_email && false === has_phone) {
            return response.api(400, null, [{message: 'You must have a column mapped as either `email` or `phone`'}]);    
        }
        // ok! now let's load the file settings
        let file;
        try {
            file = await File.findOrFail(params.id);
            await file.load(['setting']);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
        let setting;
        if (null === file.getRelated('setting')) {
            setting = new ImportSetting;
        } else {
            setting = file.getRelated('setting');
        }
        setting.column_delimiter = request.input('column_delimiter');
        setting.column_quotation = request.input('column_quotation');
        setting.filetype = request.input('filetype');
        setting.column_settings = request.input('column_settings');
        setting.header_row = request.input('header_row');
        setting.tags = request.input('tags');
        setting.conversion_settings = request.input('conversion_settings');
        try {
            await file.setting().save(setting);
            return response.api(200, setting);
        } catch (error) {
            return response.api(400, null, [{message: error.toString()}]);
        }
        return response.api(400, null, [{message: 'Debugging'}]);
    }

    async startJobProcessing(file, setting, job) {
        if ('csv' === setting.filetype && 'local' === file.drive) {
            return this._startCSVJobProcessing(file, setting, job);
        } else {
            return this._startExcelJobProcessing(file, setting, job);
        }
    }

    async _startCSVJobProcessing(file, setting, job) {
        try {
            const chunkedForEach = use('chunkedForEach');
            let startIndex = 0;
            job.total_rows = 0;
            if(job.status === 'resume') {
                // Get processed lines
                startIndex = job.processed_rows;
            }
            const countstream = await importer.getSpreadsheetAsStream(file.path, setting.column_delimiter, startIndex);
            await this.updateJobStatus(job, 'parsing');
            countstream.on('data', async () => {
                job.total_rows ++;
                if (job.total_rows % 1000 === 0) {
                    await this.saveModel(job);
                }
            });

            countstream.on('error', (error) => {
                console.warn(error);
            });

            countstream.on('end', async() => {
                await this.updateJobStatus(job, 'processing');
                const stream = await importer.getSpreadsheetAsStream(file.path, setting.column_delimiter, startIndex);
                const bucket = new Set();
                let i = 0;
                stream.on('pause', async() => {
                    await chunkedForEach(bucket, Config.get('app.batchSize'), async({value}) => {
                        try {
                            const map = await importer.makeLeadMapFromMap(value, setting.column_settings);
                            // job.total_rows ++;
                            let lead = await importer.makeElasticsearchLeadMapFromMap(map, setting);
                            lead.set('files', [file.name]);
                            /**
                             * Apply pre-duplicate check post-processing fixes
                             */
                            lead = await importer.applyPostProcessingFixesToLeadMap(lead, setting.column_settings);
                            /**
                             * Check that we have at least a valid email or phone. If not, fail the lead
                             */
                            if (!lead.has('email') && !lead.has('phone')) {
                                job.invalid_rows ++;
                            }
                            else {
                                job.valid_rows ++;
                                /**
                                 * Apply duplicate check merge
                                 */
                                let saveId;
                                let deleteId;
                                const duplicateIds = await importer.getExistingLeadId(lead);
                                if ('string' === typeof(duplicateIds) || 'object' === typeof(duplicateIds)) {
                                    job.duplicate_rows ++;
                                    switch(typeof(duplicateIds)) {
                                        case 'object':
                                            saveId = duplicateIds.phone;
                                            if (duplicateIds.phone !== duplicateIds.email) {
                                                lead = await importer.mergeLeadDetails(lead, duplicateIds.email);
                                                lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
                                                deleteId = duplicateIds.email;
                                            } else {
                                                lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
                                            }
                                            break;

                                        case 'string':
                                            lead = await importer.mergeLeadDetails(lead, duplicateIds);
                                            saveId = duplicateIds;
                                            break;
                                    }
                                }
                                /**
                                 * Apply post-duplicate check post-processing fixes
                                 */
                                lead = await importer.applyPostProcessingFixesToLeadMap(lead, setting.column_settings);
                                /**
                                 * Save lead to ElasticSearch, Update Redis Cache & Delete Duplicate Leads
                                 */
                                const {id, is_new} = await importer.enqueueLeadToElasticsearch(lead, saveId, deleteId);
                                const newText = is_new ? 'New' : 'Existing';
                                if (null === id) {
                                    job.valid_rows --;
                                    job.invalid_rows ++;
                                    console.warn(`Failed to save ${newText} Lead`);
                                } else {
                                    // console.log(`Saved ${newText} Lead with ID ${id}`);
                                }
                            }
                            job.processed_rows ++;
                            try {
                                Notifier.emit('report-processed', 1);
                            } catch (error) {
                                console.warn(`Error Emitting: ${error.toString()}`);
                            }
                        } catch (error) {
                            console.warn(`Error Parsing and Processing Row: ${error.toString()}`);
                            console.warn(error);
                            newrelic.noticeError(error);
                        }
                    }, async () => {
                        await this.saveModel(job);
                    });
                    bucket.clear();
                    stream.resume();
                });
                stream.on('data', async (row) => {
                    if (i >= startIndex) {
                        const r = new Map();
                        for (let i = 0; i < row.length; i++) {
                            const cell = row[i];
                            r.set(i, cell);
                        }
                        bucket.add(r);
                    }
                    if (bucket.size >= Config.get('app.bucketSize')) {
                        stream.pause();
                    }
                    i++;
                });

                stream.on('error', (error) => {
                    console.warn(error);
                });

                stream.on('end', async() => {
                    await sleep(100);
                    job.processed_rows = job.total_rows;
                    await this.updateJobStatus(job, 'completed');
                    this._dieIn(1000);
                });
            });
        } catch (error) {
            await this.updateJobStatus(job, 'failed');
            console.warn(`Job ${job.id} failed with error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
            this._dieIn(1000);
        }
    }

    async _startExcelJobProcessing(file, setting, job) {
        try {
            const chunkedForEach = use('chunkedForEach');
            let startIndex = 0;
            if(job.status === 'resume') {
                // Get processed lines
                startIndex = job.processed_rows;
            }
            await this.updateJobStatus(job, 'starting');
            let rows = await importer.getSpreadsheetAsSet(setting.filetype, file.drive, file.path, setting.column_delimiter);
            job.total_rows = 0 + startIndex;
            await this.saveModel(job);
            await this.updateJobStatus(job, 'parsing');
            const parsed = [];
            await chunkedForEach(rows, 25, async({value}) => {
                try {
                    const pr = await importer.makeLeadMapFromMap(value, setting.column_settings);
                    job.total_rows ++;
                    parsed.push(pr);
                } catch (error) {
                    console.warn(`Error Parsing Row: ${error.toString()}`);
                    console.warn(error);
                    newrelic.noticeError(error);
                }
            }, async () => {
                await this.saveModel(job);
            }, startIndex);
            await this.updateJobStatus(job, 'processing');
            /**
             * Process the parsed rows
             */
            await chunkedForEach(parsed, 100, async({value}) => {
                const map = value;
                try {
                    let lead = await importer.makeElasticsearchLeadMapFromMap(map, setting);
                    lead.set('files', [file.name]);
                    /**
                     * Apply pre-duplicate check post-processing fixes
                     */
                    lead = await importer.applyPostProcessingFixesToLeadMap(lead, setting.column_settings);
                    /**
                     * Check that we have at least a valid email or phone. If not, fail the lead
                     */
                    if (!lead.has('email') && !lead.has('phone')) {
                        job.invalid_rows ++;
                    }
                    else {
                        job.valid_rows ++;
                        /**
                         * Apply duplicate check merge
                         */
                        let saveId;
                        let deleteId;
                        const duplicateIds = await importer.getExistingLeadId(lead);
                        if ('string' === typeof(duplicateIds) || 'object' === typeof(duplicateIds)) {
                            job.duplicate_rows ++;
                            switch(typeof(duplicateIds)) {
                                case 'object':
                                    saveId = duplicateIds.phone;
                                    if (duplicateIds.phone !== duplicateIds.email) {
                                        lead = await importer.mergeLeadDetails(lead, duplicateIds.email);
                                        lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
                                        deleteId = duplicateIds.email;
                                    } else {
                                        lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
                                    }
                                    break;

                                case 'string':
                                    lead = await importer.mergeLeadDetails(lead, duplicateIds);
                                    saveId = duplicateIds;
                                    break;
                            }
                        }
                        /**
                         * Apply post-duplicate check post-processing fixes
                         */
                        lead = await importer.applyPostProcessingFixesToLeadMap(lead, setting.column_settings);
                        /**
                         * Save lead to ElasticSearch, Update Redis Cache & Delete Duplicate Leads
                         */
                        const {id, is_new} = await importer.enqueueLeadToElasticsearch(lead, saveId, deleteId);
                        const newText = is_new ? 'New' : 'Existing';
                        // console.log(`Saved ${newText} Lead with ID ${id}`);
                    }
                    job.processed_rows ++;
                    try {
                        Notifier.emit('report-processed', 1);
                    } catch (error) {
                        console.warn(`Error Emitting: ${error.toString()}`);
                    }
                } catch (error) {
                    console.warn(`Lead Processing Error: ${error.toString()}`);
                    console.warn(map);
                    console.warn(error);
                    newrelic.noticeError(error);
                }
            }, async () => {
                await this.saveModel(job);
            });
            await sleep(100);
            job.processed_rows = job.total_rows;
            await this.updateJobStatus(job, 'completed');
            this._dieIn(1000);
        } catch (error) {
            await this.updateJobStatus(job, 'failed');
            console.warn(`Job ${job.id} failed with error: ${error.toString()}`);
            console.warn(error);
            newrelic.noticeError(error);
            this._dieIn(1000);
        }
    }

    async updateJobStatus(job, status) {
        try {
            job.status = status;
            await job.save();
        } catch (error) {
            console.warn(`Failed to update job ${job.id} to status ${status} due to error: ${error.toString()}`);
            newrelic.noticeError(error);
        }
    }

    async saveModel(model) {
        try {
            await model.save();
        } catch (error) {
            console.warn(`Failed to update model ${model.id} due to error: ${error.toString()}`);
            newrelic.noticeError(error);
        }
    }

    async spawnForkForJob(id) {
        const {enqueue} = require('../../Services/queue');
        enqueue('import', id);
    }

    async getTags({request, response}) {
        const client = use('elasticsearch');
        const term = request.input('term', null);
        const results = new Set();
        try {
            const query = {
                index: 'leads',
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    exists: {
                                        field: 'tags',
                                    }
                                }
                            ]
                        }
                    },
                    size: 0,
                    aggs: {
                        top_tags: {
                            terms: {
                                field: 'tags.keyword',
                                size: 50,
                            }
                        }
                    }
                }
            }
            if ('string' === typeof(term) && term.length > 0) {
                query.body.query.bool.must.push({
                    prefix: {
                        tags: term,
                    }
                });
            }
            const result = await client.search(query);
            for (let i = 0; i < result.body.aggregations.top_tags.buckets.length; i++) {
                const bucket = result.body.aggregations.top_tags.buckets[i];
                results.add(bucket.key);
            }
        } catch (error) {
            console.warn(JSON.stringify(error, null, 2));
            return response.api(500, null, [{message: error.toString()}]);
        }
        const res = [];
        results.forEach((val) => {
            res.push(val);
        })
        return response.api(200, res);
    }

    _dieIn(ms, status) {
        const sleep = use('sleep');
        sleep(ms).then(process.exit(status))
    }
}

module.exports = ListController
