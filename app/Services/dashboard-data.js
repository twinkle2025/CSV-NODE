const socket = require('../Controllers/Ws/socket.io');
const {client} = require('./elasticsearch');
const sleep = use('sleep');
const newrelic = require('newrelic');

const oncePerSecondCron = async () => {
    let promises = [];
    promises.push(getTotalLeadCount());
    promises.push(getTotalEmailCount());
    promises.push(getTotalMobilePhoneCount());
    promises.push(getTotalLandlinePhoneCount());
    promises.push(getSystemResourceUtilization());
    promises.push(getElasticsearchClusterHealth());
    await Promise.all(promises);
    await sleep(100);
    promises = [];
    promises.push(getClickConversionCount());
    await Promise.all(promises);
    await sleep(100);
    promises = [];
    promises.push(getSubscriptionConversionCount());
    promises.push(getRegistrationConversionCount());
    await Promise.all(promises);
    await sleep(100);
    promises = [];
    promises.push(getFTDConversionCount());
    promises.push(getQualifiedFTDConversionCount());
    promises.push(getUpsaleConversionCount());
    promises.push(getUnsubscribeConversionCount());
    promises.push(getCallConversionCount());
    promises.push(getAnsweredCallConversionCount());
    await Promise.all(promises);
    await sleep(100);
    return oncePerSecondCron();
}

const getTotalLeadCount = async () => {
    const query = {
        index: 'leads',
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-leads', body.count);
    } catch (error) {
        console.warn(`Error fetching count of leads: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getTotalEmailCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'email.valid': true,
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-emails', body.count);
    } catch (error) {
        console.warn(`Error fetching count of emails: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getTotalMobilePhoneCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'phone.is_mobile': true,
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-mobile-phones', body.count);
    } catch (error) {
        console.warn(`Error fetching count of mobile phones: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getTotalLandlinePhoneCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'phone.is_landline': true,
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-landline-phones', body.count);
    } catch (error) {
        console.warn(`Error fetching count of landline phones: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getClickConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'conversions.type': 'click',
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-clicks', body.count);
    } catch (error) {
        console.warn(`Error fetching click conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getSubscriptionConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'conversions.type': 'subscription',
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-subscriptions', body.count);
    } catch (error) {
        console.warn(`Error fetching subscription conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getRegistrationConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'conversions.type': 'registration',
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-registrations', body.count);
    } catch (error) {
        console.warn(`Error fetching registration conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getFTDConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'conversions.type': 'ftd',
                            }
                        }
                    ]
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-ftds', body.count);
    } catch (error) {
        console.warn(`Error fetching ftd conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getQualifiedFTDConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'conversions.type': 'ftd',
                            }
                        },
                        {
                            range: {
                                'conversions.amount': {
                                    gte: 1000,
                                    boost: 2
                                }
                            }
                        },
                    ]
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-qualified-conversions-ftds', body.count);
    } catch (error) {
        console.warn(`Error fetching qualified ftd conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getUpsaleConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'conversions.type': 'deposit',
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-deposits', body.count);
    } catch (error) {
        console.warn(`Error fetching upsale conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getUnsubscribeConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                term: {
                    'conversions.type': 'unsubscribe',
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-unsubscribes', body.count);
    } catch (error) {
        console.warn(`Error fetching unsubscribe conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getCallConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'conversions.type': 'call',
                            }
                        },
                        {
                            terms: {
                                'conversions.disposition.keyword': ['CALLBK', 'CBHOLD', 'CLAGAN', 'DEC', 'DROP', 'ERI', 'INCALL', 'IVRXFR', 'LB', 'LRERR', 'LSMERG', 'MAXCAL', 'MLINAT', 'NI', 'NP', 'PDROP', 'QCFAIL', 'QVMAIL', 'RQXFER', 'SALE', 'TIMEOT', 'XDROP', 'XFER'],
                            }
                        }
                    ],
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-calls', body.count);
    } catch (error) {
        console.warn(`Error fetching call conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getAnsweredCallConversionCount = async () => {
    const query = {
        index: 'leads',
        body: {
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'conversions.type': 'call',
                            }
                        },
                        {
                            terms: {
                                'conversions.disposition.keyword': ['CALLBK', 'CBHOLD', 'CLAGAN', 'DEC', 'DROP', 'ERI', 'INCALL', 'IVRXFR', 'LB', 'LRERR', 'LSMERG', 'MAXCAL', 'MLINAT', 'NI', 'NP', 'PDROP', 'QCFAIL', 'QVMAIL', 'RQXFER', 'SALE', 'TIMEOT', 'XDROP', 'XFER'],
                            }
                        }
                    ]
                }
            }
        }
    }
    try {
        const {body} = await client.count(query);
        socket.emit('total-conversions-answered-calls', body.count);
    } catch (error) {
        console.warn(`Error fetching answered call conversion count: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

const getSystemResourceUtilization = async () => {
    const {cpu, drive, mem} = require('node-os-utils');
    try {
        const cpuUsage = await cpu.usage();
        socket.emit('cpu-utilization', parseFloat(cpuUsage).toFixed(2));
    } catch (error) {}
    try {
        const {usedPercentage} = await drive.info();
        socket.emit('disk-utilization', parseFloat(usedPercentage).toFixed(2));
    } catch (error) {}
    try {
        const {freeMemPercentage} = await mem.info();
        const usedMemPercentage = 100 - freeMemPercentage;
        socket.emit('memory-utilization', parseFloat(usedMemPercentage).toFixed(2));
    } catch (error) {}
}

const getElasticsearchClusterHealth = async () => {
    try {
        const {body} = await client.cluster.health();
        socket.emit('elasticsearch-cluster-health', body.status);
    } catch (error) {
        console.warn(`Error fetching Elasticsearch Cluster Health Status: ${error.toString()}`);
        console.warn(error.body.error);
        newrelic.noticeError(error);
    }
}

// setInterval(oncePerSecondCron, 1000);
oncePerSecondCron();

const processorReporter = use('processorReporter');

module.exports = processorReporter;