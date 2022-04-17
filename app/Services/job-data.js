const socket = require('../Controllers/Ws/socket.io');

const oncePerSecondCron = async () => {
    updateUpdatedImportJobs();
    updateUpdatedExportJobs();
}

const updateUpdatedImportJobs = async () => {
    const ImportJob = use('App/Models/ImportJob');
    const moment = require('moment-timezone');
    const updatedJobs = await ImportJob.query().where('updated_at', '>=', moment().subtract(1, 'second').format('YYYY-MM-DD HH:mm:ss')).fetch();
    if (Array.isArray(updatedJobs.rows)) {
        for (let i = 0; i < updatedJobs.rows.length; i++) {
            const job = updatedJobs.rows[i];
            if (job.status !== 'new') {
                socket.emit('job', {job});
            }
        }
    }
}

const updateUpdatedExportJobs = async () => {
    const ExportJob = use('App/Models/ExportJob');
    const moment = require('moment-timezone');
    const updatedJobs = await ExportJob.query().where('updated_at', '>=', moment().subtract(1, 'second').format('YYYY-MM-DD HH:mm:ss')).fetch();
    if (Array.isArray(updatedJobs.rows)) {
        for (let i = 0; i < updatedJobs.rows.length; i++) {
            const job = updatedJobs.rows[i];
            if (job.status !== 'new') {
                socket.emit('export-job', {job});
            }
        }
    }
}

setInterval(oncePerSecondCron, 1000);
oncePerSecondCron();