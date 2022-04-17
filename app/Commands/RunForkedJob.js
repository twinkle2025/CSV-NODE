'use strict'

const { Command } = require('@adonisjs/ace')

class RunForkedJob extends Command {
  static get signature () {
    return `
      run:job
      { type=import : The type of job to run. Options are "import", "export" and "transfer". Defaults to "import" }
      { id : The ID of the job which you are running }
    `;
  }

  static get description () {
    return 'Run an import or export job as a seperate thread.';
  }

  async handle (args, options) {
    if (process.send === undefined) {
      this.warn('You are not running this command as a forked thread. Live streamer updates from this thread will not work.');
    }
    switch(args.type) {
      case 'import':
        this.runImportJob(args.id);
        break;

      case 'export':
        this.runExportJob(args.id);
        break;

      case 'transfer':
        this.runTransferJob(args.id);
        break;
    }
  }

  async runImportJob(id) {
    const ImportJob = use('App/Models/ImportJob');
    const File = use('App/Models/File');
    const ListController = require('../Controllers/Http/ListController');
    const ListControllerInstance = new ListController;
    try {
      const job = await ImportJob.findOrFail(id);
      await job.load('file');
      const file = await File.find(job.getRelated('file').id);
      await file.loadMany(['jobs', 'setting']);
      const setting = file.getRelated('setting');
      if (null === setting || 'undefined' === typeof(setting)) {
        this.error(`Missing import settings for job ${id}. Cannot continue.`);
        return false;
      }
      ListControllerInstance.startJobProcessing(file, setting, job);
    } catch (error) {
      this.error(`Job ${id} Failed with error: Cannot continue.`);
      this.error(error.toString());
      console.warn(error);
      return false;
    }
  }

  async runExportJob(id) {
    const ExportJob = use('App/Models/ExportJob');
    const LeadController = require('../Controllers/Http/LeadController');
    const LeadControllerInstance = new LeadController;
    try {
      const e = await ExportJob.findOrFail(id);
      await LeadControllerInstance.processExport(e);
    } catch (error) {
      this.error(`Job ${id} Failed with error: Cannot continue.`);
      this.error(error.toString());
      console.warn(error);
      return false;
    }
  }

  async runTransferJob(id) {
    const TransferJob = use('App/Models/TransferJob');
    const TransferFromController = require('../Controllers/Http/TransferFromController');
    const TransferFromControllerInstance = new TransferFromController;
    try {
      const e = await TransferJob.findOrFail(id);
      await TransferFromControllerInstance.processTransfer(e);
    } catch (error) {
      this.error(`Transfer job ${id} Failed with error: Cannot continue.`);
      this.error(error.toString());
      console.warn(error);
      return false;
    }
  }
}

module.exports = RunForkedJob
