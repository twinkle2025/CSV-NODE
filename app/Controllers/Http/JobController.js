'use strict'

const ImportJob = use('App/Models/ImportJob');
const File = use('App/Models/File');
const ListController = require('./ListController');
const ListControllerInstance = new ListController;
const { stopJob, enqueue } = require('../../Services/queue');
const EnqueuedJob = use('App/Models/EnqueuedJob');
require('newrelic');

class JobController {
    async listProcessing({ response, request }) {
        const query = ImportJob.query().whereNotIn('status', ['completed', 'failed', 'cancelled']).with('file')
        if ('object' === typeof (request.input('search')) && null !== request.input('search')) {
            const search = request.input('search');
            if ('undefined' !== typeof (search.value) && search.value.length > 0) {
                query.whereHas('file', (builder) => {
                    builder.where('name', 'like', search.value);
                })
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
        if ('undefined' === typeof (start) || null === start || parseInt(start) < 0) {
            start = 0;
        }
        if ('undefined' === typeof (length) || null === length || parseInt(length) < 10) {
            length = 10;
        }
        start++;
        const startPage = Math.ceil(start / length);
        const paginatedResults = await query.paginate(startPage, length);
        const rows = [];
        for (let i = 0; i < paginatedResults.rows.length; i++) {
            const row = paginatedResults.rows[i];
            rows.push([
                row.id,
                row.getRelated('file').name,
                row.status,
                row.total_rows,
                row.processed_rows,
                row.valid_rows,
                row.invalid_rows,
                row.duplicate_rows,
                row.created_at
            ]);
        }
        return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
    }

    async stopJob({ response, request, params }) {
        const { id } = params;
        try {
            const job = await ImportJob.findOrFail(id);
            job.status = 'stopped';
            await EnqueuedJob.query().where({ job_id: id }).update({ has_started: 1 });
            await stopJob(id);
            await job.save();
            return response.api(200, id);
        } catch (error) {
            return response.api(400, null, [{ message: error.toString() }]);
        }
    }

    async resumeJob({ response, request, params }) {
        try {
            const { id } = params;
            const job = await ImportJob.findOrFail(id);
            job.status = 'resume';
            await job.save();
            enqueue('import', id);
            return response.api(200, id);
        } catch (error) {
            return response.api(400, null, [{ message: error.toString() }]);
        }
    }

    async cancelJob({ response, request, params }) {
        try {
            const { id } = params;
            const job = await ImportJob.findOrFail(id);
            await EnqueuedJob.query().where({ job_id: id }).update({ has_started: 1 });
            job.status = 'cancelled';
            await stopJob(id);
            await job.save();
            return response.api(200, id);
        } catch (error) {
            return response.api(400, null, [{ message: error.toString() }]);
        }
    }

    async listCompleted({ response, request }) {
        const query = ImportJob.query().whereIn('status', ['completed', 'failed', 'cancelled']).with('file')
        if ('object' === typeof (request.input('search')) && null !== request.input('search')) {
            const search = request.input('search');
            if ('undefined' !== typeof (search.value) && search.value.length > 0) {
                query.whereHas('file', (builder) => {
                    builder.where('name', 'like', search.value);
                })
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
        if ('undefined' === typeof (start) || null === start || parseInt(start) < 0) {
            start = 0;
        }
        if ('undefined' === typeof (length) || null === length || parseInt(length) < 10) {
            length = 10;
        }
        start++;
        const startPage = Math.ceil(start / length);
        const paginatedResults = await query.paginate(startPage, length);
        const rows = [];
        for (let i = 0; i < paginatedResults.rows.length; i++) {
            const row = paginatedResults.rows[i];
            rows.push([
                row.id,
                row.getRelated('file').name,
                row.status,
                row.total_rows,
                row.processed_rows,
                row.valid_rows,
                row.invalid_rows,
                row.duplicate_rows,
                row.created_at,
                row.getRelated('file').id
            ]);
        }
        return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
    }

    async get({ response, request, params }) {
        try {
            const job = await ImportJob.findOrFail(params.id);
            await job.load('file');
            return response.api(200, job);
        } catch (error) {
            return response.api(400, null, [{ message: error.toString() }]);
        }
    }

    async restart({ response, request, params }) {
        try {
            const job = await ImportJob.findOrFail(params.id);
            await job.load('file');
            const file = await File.find(job.getRelated('file').id);
            await file.loadMany(['jobs', 'setting']);
            const setting = file.getRelated('setting');
            if (null === setting || 'undefined' === typeof (setting)) {
                return response.api(400, null, [{ message: 'You have not setup the import settings for this file yet.' }]);
            }
            job.status = 'new';
            job.total_rows = 0;
            job.processed_rows = 0;
            job.valid_rows = 0;
            job.duplicate_rows = 0;
            job.invalid_rows = 0;
            await file.jobs().save(job);
            //ListControllerInstance.startJobProcessing(file, setting, job);
            ListControllerInstance.spawnForkForJob(job.id);
            return response.api(200, file);
        } catch (error) {
            return response.api(400, null, [{ message: error.toString() }]);
        }
    }
}

module.exports = JobController
