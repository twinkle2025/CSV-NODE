'use strict'

const { Command } = require('@adonisjs/ace')
const ExportJob = use('App/Models/ExportJob');
const LeadController = require('../Controllers/Http/LeadController');
const LeadControllerInstance = new LeadController;
const Config = use('Config');
const moment = require('moment-timezone');

class RunExporter extends Command {
  static get signature () {
    return 'run:exports'
  }

  static get description () {
    return 'Run Export Jobs'
  }

  async handle (args, options) {
    const io = require('../Controllers/Ws/socket.io');
    setInterval( async () => {
      await this.processNewAndPendingJobs();
    }, 1000);
  }

  async processNewAndPendingJobs() {
    this.info('Checking how many jobs are currently running');
    const maxJobs = Config.get('app.maxJobs', 2);
    const jobCountQuery = ExportJob.query().whereIn('status', ['loading records', 'formatting data', 'creating file', 'saving file']);
    const jobCount = await jobCountQuery.getCount();
    if (jobCount >= maxJobs) {
      this.warn(`${jobCount} jobs already running`);
      return;
    }
    const availableSlots = maxJobs - jobCount;
    this.info(`Looking for ${availableSlots} New & Pending Jobs`);
    const jobs = await ExportJob.query().whereIn('status', ['new', 'pending']).orderBy('id', 'asc').limit(availableSlots).fetch();
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
    LeadControllerInstance.processExport(job);
  }
}

module.exports = RunExporter
