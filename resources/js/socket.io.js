const io = require('socket.io-client');
const socket = io();

import Notification from './notify';

socket.on('job', ({job}) => {
    switch(job.status) {
        case 'new':
            PNotify.info({
                title: 'Job is Processing',
                text: `Import Job ${job.id} has started`,
                type: 'info'
            });
            Notification.send('Job is Processing', `Import Job ${job.id} has started`);
            break;
        case 'completed':
            PNotify.success({
                title: 'Job Completed',
                text: `Import Job ${job.id} has finished successfully`,
                type: 'success'
            });
            Notification.send('Job Completed', `Import Job ${job.id} has finished successfully`);
            break;
        case 'failed':
            PNotify.danger({
                title: 'Job Failed',
                text: `Import Job ${job.id} has failed`,
                type: 'danger'
            });
            Notification.send('Job Failed', `Import Job ${job.id} has failed`);
            break;
        case 'stuck':
            PNotify.warning({
                title: 'Job Stuck',
                text: `Import Job ${job.id} is stuck`,
                type: 'warning'
            });
            Notification.send('Job Stuck', `Import Job ${job.id} is stuck`);
            break;
    }
})

socket.on('export-job', ({job}) => {
    switch(job.status) {
        case 'new':
            PNotify.info({
                title: 'Job is Processing',
                text: `Export Job ${job.id} has started`,
                type: 'info'
            });
            Notification.send('Job is Processing', `Export Job ${job.id} has started`);
            break;
        case 'completed':
            PNotify.success({
                title: 'Job Completed',
                text: `Export Job ${job.id} has finished successfully`,
                type: 'success'
            });
            Notification.send('Job Completed', `Export Job ${job.id} has finished successfully`);
            break;
        case 'failed':
            PNotify.danger({
                title: 'Job Failed',
                text: `Export Job ${job.id} has failed`,
                type: 'danger'
            });
            Notification.send('Job Failed', `Export Job ${job.id} has failed`);
            break;
        case 'stuck':
            PNotify.warning({
                title: 'Job Stuck',
                text: `Export Job ${job.id} is stuck`,
                type: 'warning'
            });
            Notification.send('Job Stuck', `Export Job ${job.id} is stuck`);
            break;
    }
})

socket.on('notification', ({title, body, type}) => {
    Notification.send(title, body);
    switch(type) {
        case 'notice':
            PNotify.notice({
                title,
                text: body,
                type,
            });
            break;

        case 'success':
            PNotify.success({
                title,
                text: body,
                type,
            });
            break;

        case 'warning':
            PNotify.warning({
                title,
                text: body,
                type,
            });
            break;

        case 'danger':
            PNotify.danger({
                title,
                text: body,
                type,
            });
            break;

        case 'alert':
            PNotify.alert({
                title,
                text: body,
                type,
            });
            break;

        default:
            PNotify.info({
                title,
                text: body,
                type: 'info'
            });
            break;
    }
})

socket.on('disabled-proxy', ({item}) => {
    PNotify.danger({
        title: 'Proxy Disabled',
        text: `Proxy ${item.type}://${item.host}:${item.port} has been disabled`,
        type: 'danger',
    });
})

socket.on('disabled-email-account', ({item}) => {
    PNotify.danger({
        title: 'Email Account Disabled',
        text: `Email Account ${item.email} via ${item.host} has been disabled`,
        type: 'danger',
    });
})


export default socket;