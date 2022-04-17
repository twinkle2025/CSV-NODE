'use strict'

const { Command } = require('@adonisjs/ace')
const ImportJob = use('App/Models/ImportJob');
const File = use('App/Models/File');
const ListController = require('../Controllers/Http/ListController');
const ListControllerInstance = new ListController;
const Config = use('Config');
const moment = require('moment-timezone');

class RunImporter extends Command {
  static get signature () {
    return 'run:imports'
  }

  static get description () {
    return 'Run Import Jobs'
  }

  async handle () {
    const io = require('../Controllers/Ws/socket.io');
    setInterval( async () => {
      await this.checkForStuckJobs();
      await this.processNewAndPendingJobs();
    }, 1000);
  }

  async checkForStuckJobs() {
    this.info('Checking for stuck jobs');
    const stuckJobs = await ImportJob.query().where('status', 'processing').where('updated_at', '<=', moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss')).fetch();
    if (Array.isArray(stuckJobs.rows)) {
      this.success(`Found ${stuckJobs.rows.length} stuck jobs`);
      for (let i = 0; i < stuckJobs.rows.length; i++) {
        const job = stuckJobs.rows[i];
        job.status = 'stuck';
        try {
          job.save();
        } catch (error) {
          console.warn(error);
        }
      }
    } else {
      this.success('No stuck jobs found');
    }
    return;
  }

  async processNewAndPendingJobs() {
    this.info('Checking how many jobs are currently running');
    const maxJobs = Config.get('app.maxJobs', 2);
    const jobCountQuery = ImportJob.query().where('status', 'like', 'processing');
    const jobCount = await jobCountQuery.getCount();
    if (jobCount >= maxJobs) {
      this.warn(`${jobCount} jobs already running`);
      return;
    }
    const availableSlots = maxJobs - jobCount;
    this.info(`Looking for ${availableSlots} New & Pending Jobs`);
    const jobs = await ImportJob.query().whereIn('status', ['new', 'pending']).orderBy('id', 'asc').limit(availableSlots).with('file').fetch();
    if (Array.isArray(jobs.rows)) {
      this.success(`Found ${jobs.rows.length} jobs`);
      for (let i = 0; i < jobs.rows.length; i++) {
        const job = jobs.rows[i];
        this.startJob(job);
      }
    } else {
      this.success('No jobs found');
    }
    return;
  }

  async startJob(job) {
    this.success(`Starting Job ${job.id}`);
    const file = await File.find(job.getRelated('file').id);
    await file.loadMany(['jobs', 'setting']);
    const setting = file.getRelated('setting');
    if (null === setting || 'undefined' === typeof(setting)) {
      this.error('You have not setup the import settings for this file yet.');
      return false;
    }
    ListControllerInstance.startJobProcessing(file, setting, job);
  }
}

module.exports = RunImporter
