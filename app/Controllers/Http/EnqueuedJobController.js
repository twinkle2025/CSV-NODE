'use strict'

const Config = use('Config');
const EnqueuedJob = use('App/Models/EnqueuedJob');
const moment = require('moment-timezone');
require('newrelic');

class EnqueuedJobController {

    constructor() {
      this.queue = {};
    }

    async enqueue(type, id) {
      try {
        const job = new EnqueuedJob;
        job.type = type;
        job.job_id = id;
        job.has_started = false;
        await job.save();
      } catch (error) {
        console.warn(error);
      }
    }

    async stopJob(id) {
      try {
        if(Object.prototype.hasOwnProperty.call(this.queue, id)) {
          const job = this.queue[id];
          job.kill();
          delete this.queue[id];
        } else {
          // TODO: Add error handling in case doesn't exist
        }
      } catch (error) {
        console.log(`Error: ${error}`);
      }
    }

    async spawnForkForJob(type, id) {
      const Helpers = use('Helpers');
      const io = require('../Ws/socket.io');
      const { fork } = require('child_process');
      const esqueue = use('esqueue');
      const forked = fork(Helpers.appRoot('ace'), ['run:job', type, id], {
        env: {
            'max-old-space-size': '4096',
            'max_old_space_size': '4096',
            'optimize_for_size': true,
        },
        silent: false,
      });
      if ('undefined' === typeof(this.queue)) {
        this.queue = {};
      }
      this.queue[id] = forked;
      forked.on('message', ({event, data}) => {
        switch(event) {
          case 'report-processed':
            const processorReporter = require('../../Services/dashboard-data');
            processorReporter.record();
            break;

          case 'add-lead-insert':
            esqueue.addInsert(data.lead);
            break;

          case 'add-lead-update':
            esqueue.addUpdate(data.lead, data.leadId);
            break;

          default:
            io.emit(event, data);
            break;
        }
      });
      forked.on('error', () => {
        delete this.queue[id];
      });
      forked.on('exit', () => {
        delete this.queue[id];
      });
    }

    getActiveStatusesFor(type) {
      switch(type) {
        case 'import':
          return ['starting', 'processing', 'parsing'];
        case 'export':
          return ['starting', 'failed', 'exporting to api', 'writing file', 'loading records'];
        case 'transfer':
          return ['starting', 'downloading'];
        default:
          return [];
      }
    }

    async findStuckImports() {
      //console.log('Checking for stuck Import Jobs');
      const ImportJob = use('App/Models/ImportJob');
      const statuses = this.getActiveStatusesFor('import');
      try {
        const stuck = await ImportJob.query().whereIn('status', statuses)
          .where('updated_at', '<', moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'))
          .fetch();
        for (let i = 0; i < stuck.rows.length; i++) {
          const job = stuck.rows[i];
          if (!this._hasRunningFork('import', job.id)) {
            job.status = 'stuck';
            await job.save();
            console.log(`Import Job ${job.id} was marked as stuck`);
          }
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async findStuckExports() {
      //console.log('Checking for stuck Export Jobs');
      const ExportJob = use('App/Models/ExportJob');
      const statuses = this.getActiveStatusesFor('export');
      try {
        const stuck = await ExportJob.query().whereIn('status', statuses)
          .where('updated_at', '<', moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'))
          .fetch();
        for (let i = 0; i < stuck.rows.length; i++) {
          const job = stuck.rows[i];
          if (!this._hasRunningFork('export', job.id)) {
            job.status = 'stuck';
            await job.save();
            console.log(`Export Job ${job.id} was marked as stuck`);
          }
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async findStuckTransfers() {
      //console.log('Checking for stuck Transfer Jobs');
      const TransferJob = use('App/Models/TransferJob');
      const statuses = this.getActiveStatusesFor('transfer');
      try {
        const stuck = await TransferJob.query().whereIn('status', statuses)
          .where('updated_at', '<', moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'))
          .fetch();
        for (let i = 0; i < stuck.rows.length; i++) {
          const job = stuck.rows[i];
          if (!this._hasRunningFork('transfer', job.id)) {
            job.status = 'stuck';
            await job.save();
            console.log(`Transfer Job ${job.id} was marked as stuck`);
          }
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async processImportQueue() {
      //console.log('Processing Import Queue');
      const maxJobs = Config.get('app.maxJobs', 2);
      const ImportJob = use('App/Models/ImportJob');
      const statuses = this.getActiveStatusesFor('import');
      try {
        const count = await ImportJob.query().whereIn('status', statuses).getCount();
        //console.log(`There are ${count} Import Jobs Running`);
        if (count >= maxJobs) {
          //console.warn(`There are too many Import jobs running (${count}/${maxJobs}). Aborting.`);
          return;
        }
        const diff = maxJobs - count;
        //console.log(`Fetching the next ${diff} Import Jobs in the queue`);
        const jobs = await EnqueuedJob.query().where('has_started', false).orderBy('id', 'asc').where('type', 'import').limit(diff).fetch();
        if (0 === jobs.rows.length) {
          // console.warn('No Import jobs enqueued. Aborting.');
          return;
        }
        if (jobs.rows.length > maxJobs) {
          console.warn(`Retrieved ${jobs.rows.length} Import Jobs instead of ${maxJobs}. Aborting.`);
          return;
        }
        console.info(`Found ${jobs.rows.length} of ${diff} Import Jobs`);
        for (let i = 0; i < jobs.rows.length; i++) {
          const job = jobs.rows[i];
          console.log(`Starting Import Job ${job.job_id} from Queue ${job.id}`);
          await this.spawnForkForJob('import', job.job_id);
          job.has_started = true;
          await job.save();
          //console.log(`Started Import Job ${job.job_id} from Queue ${job.id}`);
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async processExportQueue() {
      //console.log('Processing Export Queue');
      const maxJobs = Config.get('app.maxJobs', 2);
      const ExportJob = use('App/Models/ExportJob');
      const statuses = this.getActiveStatusesFor('export');
      try {
        const count = await ExportJob.query().whereIn('status', statuses).getCount();
        //console.log(`There are ${count} Export Jobs Running`);
        if (count >= maxJobs) {
          //console.warn(`There are too many Export jobs running (${count}/${maxJobs}). Aborting.`);
          return;
        }
        const diff = maxJobs - count;
        //console.log(`Fetching the next ${diff} Export Jobs in the queue`);
        const jobs = await EnqueuedJob.query().where('has_started', false).orderBy('id', 'asc').where('type', 'export').limit(diff).fetch();
        if (0 === jobs.rows.length) {
          //console.warn('No Export jobs enqueued. Aborting.');
          return;
        }
        if (jobs.rows.length > maxJobs) {
          console.warn(`Retrieved ${jobs.rows.length} Export Jobs instead of ${maxJobs}. Aborting.`);
          return;
        }
        console.info(`Found ${jobs.rows.length} of ${diff} Export Jobs`);
        for (let i = 0; i < jobs.rows.length; i++) {
          const job = jobs.rows[i];
          console.log(`Starting Export Job ${job.job_id} from Queue ${job.id}`);
          this.spawnForkForJob('export', job.job_id);
          job.has_started = true;
          await job.save();
          //console.log(`Started Export Job ${job.job_id} from Queue ${job.id}`);
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async processTransferQueue() {
      //console.log('Processing Transfer Queue');
      const maxJobs = Config.get('app.maxJobs', 2);
      const TransferJob = use('App/Models/TransferJob');
      const statuses = this.getActiveStatusesFor('transfer');
      try {
        const count = await TransferJob.query().whereIn('status', statuses).getCount();
        //console.log(`There are ${count} Transfer Jobs Running`);
        if (count >= maxJobs) {
          //console.warn(`There are too many Transfer jobs running (${count}/${maxJobs}). Aborting.`);
          return;
        }
        const diff = maxJobs - count;
        //console.log(`Fetching the next ${diff} Transfer Jobs in the queue`);
        const jobs = await EnqueuedJob.query().where('has_started', false).orderBy('id', 'asc').where('type', 'transfer').limit(diff).fetch();
        if (0 === jobs.rows.length) {
          //console.warn('No Transfer jobs enqueued. Aborting.');
          return;
        }
        if (jobs.rows.length > maxJobs) {
          console.warn(`Retrieved ${jobs.rows.length} Transfer Jobs instead of ${maxJobs}. Aborting.`);
          return;
        }
        console.info(`Found ${jobs.rows.length} of ${diff} Transfer Jobs`);
        for (let i = 0; i < jobs.rows.length; i++) {
          const job = jobs.rows[i];
          console.log(`Starting Transfer Job ${job.job_id} from Queue ${job.id}`);
          this.spawnForkForJob('transfer', job.job_id);
          job.has_started = true;
          await job.save();
          //console.log(`Started Transfer Job ${job.job_id} from Queue ${job.id}`);
        }
      } catch (error) {
        console.warn(error);
      }
    }

    async processMessageQueue() {
      const EnqueuedMessage = use('App/Models/EnqueuedMessage');
      const messagequeue = use('messagequeue');
      const jobs = await EnqueuedMessage.query().where('status', 'new').where('send_at', '<=', moment().format('YYYY-MM-DD HH:mm:ss')).orderBy('id', 'asc').fetch();
      if (0 === jobs.rows.length) {
        //console.warn('No SMS Messages jobs enqueued. Aborting.');
        return;
      }      
      console.info(`Found ${jobs.rows.length} Enqueued Messages`);
      const cfe = use('chunkedForEach');
      await cfe(jobs.rows, 10, async ({value}) => {
        await messagequeue.send(value);
      });
    }

    async processEmailQueue() {
      const EnqueuedEmail = use('App/Models/EnqueuedEmail');
      const messagequeue = use('messagequeue');
      const jobs = await EnqueuedEmail.query().where('started', false).where('send_at', '<=', moment().format('YYYY-MM-DD HH:mm:ss')).orderBy('id', 'asc').limit(500).fetch();
      if (0 === jobs.rows.length) {
        //console.warn('No Email Message jobs enqueued. Aborting.');
        return;
      }      
      console.info(`Found ${jobs.rows.length} Enqueued Emails`);
      const cfe = use('chunkedForEach');
      await cfe(jobs.rows, 1, async ({value}) => {
        await messagequeue.sendEmail(value);
      });
    }

    async resetCurrentHourlyEmailCounts() {
      const EmailAccount = use('App/Models/EmailAccount');
      return await EmailAccount.query().where('active', true).update({'current_hourly': 0});
    }

    async resetCurrentDailyEmailCounts() {
      const EmailAccount = use('App/Models/EmailAccount');
      return await EmailAccount.query().where('active', true).update({'current_daily': 0});
    }

    _hasRunningFork(type, id) {
      let ret = false;
      for (let queueid in this.queue) {
        const process = this.queue[queueid];
        const args = process.spawnargs;
        const pt = args[6];
        const pid = args[7];
        if (pt === type && id === pid) {
          ret = true;
        }
      }
      return ret;
    }
}

module.exports = EnqueuedJobController;
