const EnqueuedJobController = require('../Controllers/Http/EnqueuedJobController');
const EnqueuedJobControllerInstance = new EnqueuedJobController;
const CronJob = require('cron').CronJob;
const esqueue = use('esqueue');

const sleep = (ms) => {
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

const cron = async () => {
    // const moment = require('moment-timezone');
    // console.log(`Starting Queue Cron at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    const stuckPromises = [];
    stuckPromises.push(EnqueuedJobControllerInstance.findStuckImports());
    stuckPromises.push(EnqueuedJobControllerInstance.findStuckExports());
    stuckPromises.push(EnqueuedJobControllerInstance.findStuckTransfers());
    await Promise.all(stuckPromises);
    const enqueuePromises = [];
    enqueuePromises.push(EnqueuedJobControllerInstance.processImportQueue());
    enqueuePromises.push(EnqueuedJobControllerInstance.processExportQueue());
    enqueuePromises.push(EnqueuedJobControllerInstance.processTransferQueue());
    await Promise.all(enqueuePromises);
    await EnqueuedJobControllerInstance.processMessageQueue();
    await EnqueuedJobControllerInstance.processEmailQueue();
    //console.log(`Finished Queue Cron at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    await sleep(5000);
    cron();
}

/**
 * Instead of using "Intervals", we are going to run back-to-back function calls
 * But with a sleep function to ensure that we're not calling too quickly
 */
cron();


const enqueue = async (type, id) => {
    return await EnqueuedJobControllerInstance.enqueue(type, id);
}
const stopJob = async (id) => {
    return await EnqueuedJobControllerInstance.stopJob(id);
}

new CronJob('0 0 * * * *', () => {
    EnqueuedJobControllerInstance.resetCurrentHourlyEmailCounts();
}, null, true);

new CronJob('0 0 0 * * *', () => {
    EnqueuedJobControllerInstance.resetCurrentDailyEmailCounts();
}, null, true);

new CronJob('* * * * * *', () => {
    esqueue.process();
}, null, true);

new CronJob('* * * * * *', async () => {
    await sleep(500);
    esqueue.process();
}, null, true);

module.exports = {
    enqueue,
    stopJob
}