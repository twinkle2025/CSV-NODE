import VueRouter from 'vue-router';
import components from './components';

console.log(components);
const routes = [
    {
        path: '/',
        component: components.get('page-dashboard'),
        meta: {
            title: 'Dashboard',
            breadcrumbs: [],
        }
    },
    {
        path: '/marketing/',
        component: components.get('page-marketing-dashboard'),
        meta: {
            title: 'Marketing Dashboard',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                }
            ],
        }
    },
    {
        path: '/marketing/reports/:type',
        component: components.get('page-marketing-reports'),
        meta: {
            title: 'Marketing Report',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/utilities/hasoffers/upload-click-report',
        component: components.get('page-marketing-utilities-hasoffers-upload-click-report'),
        meta: {
            title: 'Upload HasOffers Click Report',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/supressed/review',
        component: components.get('page-marketing-email-supressed-review'),
        meta: {
            title: 'Review Clicks',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/supressed/emails',
        component: components.get('page-marketing-email-supressed-emails'),
        meta: {
            title: 'Supressed Emails',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/supressed/domains',
        component: components.get('page-marketing-email-supressed-domains'),
        meta: {
            title: 'Supressed Domains',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/providers',
        component: components.get('page-marketing-sms-providers-index'),
        meta: {
            title: 'SMS Providers',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/providers/new',
        component: components.get('page-marketing-sms-providers-edit'),
        meta: {
            title: 'Create an SMS Provider',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/sms/providers',
                    display: 'SMS Providers',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/providers/:id',
        component: components.get('page-marketing-sms-providers-edit'),
        meta: {
            title: 'Edit an SMS Provider',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/sms/providers',
                    display: 'SMS Providers',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/send',
        component: components.get('page-marketing-sms-send-index'),
        meta: {
            title: 'SMS Blasts',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/send/new',
        component: components.get('page-marketing-sms-send-edit'),
        meta: {
            title: 'Send SMS Blast',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/sms/send',
                    display: 'SMS Blasts',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/send/:id',
        component: components.get('page-marketing-sms-send-report'),
        meta: {
            title: 'View SMS Blast Report',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/sms/send',
                    display: 'SMS Blasts',
                },
                {
                    to: '/marketing/sms/send/new',
                    display: 'Send SMS Blast',
                }
            ],
        }
    },
    {
        path: '/lists/upload',
        component: components.get('page-lists-upload'),
        meta: {
            title: 'Upload a List',
            breadcrumbs: [],
        }
    },
    {
        path: '/lists/upload/experimental',
        component: components.get('page-lists-upload-experimental'),
        meta: {
            title: 'Experimental List Uploader',
        }
    },
    {
        path: '/lists/uploaded',
        component: components.get('page-lists-uploaded'),
        meta: {
            title: 'Uploaded Lists',
            breadcrumbs: [],
        }
    },
    {
        path: '/lists/processing',
        component: components.get('page-lists-processing'),
        meta: {
            title: 'Processing Jobs',
            breadcrumbs: [],
        }
    },
    {
        path: '/lists/finished',
        component: components.get('page-lists-completed'),
        meta: {
            title: 'Finished Jobs',
            breadcrumbs: [],
        }
    },
    // {
    //     path: '/lists/uploaded/bulk-setup',
    //     component: components.get('page-lists-uploaded-settings-bulk'),
    //     meta: {
    //         title: 'Bulk File Import Settings',
    //         breadcrumbs: [
    //             {
    //                 to: '/lists/uploaded',
    //                 display: 'Uploaded Lists',
    //             }
    //         ],
    //     }
    // },
    {
        path: '/lists/uploaded/:id',
        component: components.get('page-lists-uploaded-settings'),
        meta: {
            title: 'File Import Settings',
            breadcrumbs: [
                {
                    to: '/lists/uploaded',
                    display: 'Uploaded Lists',
                }
            ],
        }
    },
    {
        path: '/lists/uploaded/:id/start',
        component: components.get('page-lists-uploaded-start'),
        meta: {
            title: 'Start Importing File',
            breadcrumbs: [
                {
                    to: '/lists/uploaded',
                    display: 'Uploaded Lists',
                }
            ],
        }
    },
    {
        path: '/lists/uploaded/:id/delete',
        component: components.get('page-lists-uploaded-delete'),
        meta: {
            title: 'Delete File',
            breadcrumbs: [
                {
                    to: '/lists/uploaded',
                    display: 'Uploaded Lists',
                }
            ],
        }
    },
    {
        path: '/lists/processing/:id/:jobType',
        component: components.get('page-lists-job-action'),
        meta: {
            title: 'Restart a Job',
            breadcrumbs: [
                {
                    to: '/lists/processing',
                    display: 'Processing Lists',
                }
            ],
        }
    },
    {
        path: '/leads/list',
        component: components.get('page-leads-list'),
        meta: {
            title: 'List Leads',
        }
    },
    {
        path: '/leads/export',
        component: components.get('page-leads-export-wizard'),
        meta: {
            title: 'Export to File Wizard',
        }
    },
    {
        path: '/leads/api-export',
        component: components.get('page-export-apis-wizard'),
        meta: {
            title: 'Export to API Wizard',
        }
    },
    {
        path: '/leads/exports',
        component: components.get('page-leads-export-jobs'),
        meta: {
            title: 'Export Jobs',
        }
    },
    {
        path: '/transfer-from/google-drive',
        component: components.get('page-transfer-wizards-google'),
        meta: {
            title: 'Transfer from Google Drive',
            breadcrumbs: [],
        }
    },
    {
        path: '/export/templates',
        component: components.get('page-export-templates-index'),
        meta: {
            title: 'Export Templates',
            breadcrumbs: [],
        }
    },
    {
        path: '/export/templates/new',
        component: components.get('page-export-templates-edit'),
        meta: {
            title: 'Create an Export Template',
            breadcrumbs: [
                {
                    to: '/export/templates',
                    display: 'Export Templates',
                }
            ],
        }
    },
    {
        path: '/export/templates/:id',
        component: components.get('page-export-templates-edit'),
        meta: {
            title: 'Edit an Export Template',
            breadcrumbs: [
                {
                    to: '/export/templates',
                    display: 'Export Templates',
                }
            ],
        }
    },
    {
        path: '/export/apis',
        component: components.get('page-export-apis-index'),
        meta: {
            title: 'Export APIs',
            breadcrumbs: [],
        }
    },
    {
        path: '/export/apis/new',
        component: components.get('page-export-apis-edit'),
        meta: {
            title: 'Create an Export API',
            breadcrumbs: [
                {
                    to: '/export/apis',
                    display: 'Export APIs',
                }
            ],
        }
    },
    {
        path: '/export/apis/:id',
        component: components.get('page-export-apis-edit'),
        meta: {
            title: 'Edit an Export API',
            breadcrumbs: [
                {
                    to: '/export/apis',
                    display: 'Export APIs',
                }
            ],
        }
    },
    {
        path: '/transfer-from/jobs',
        component: components.get('page-transfer-wizards-jobs'),
        meta: {
            title: 'Processing Transfers',
            breadcrumbs: [],
        }
    },
    {
        path: '/capture/endpoints/leadpages',
        component: components.get('page-capture-endpoints-leadpages-index'),
        meta: {
            title: 'LeadPages Capture Endpoints',
            breadcrumbs: [],
        }
    },
    {
        path: '/capture/endpoints/generic',
        component: components.get('page-capture-endpoints-generic-index'),
        meta: {
            title: 'Generic Capture Endpoints',
            breadcrumbs: [],
        }
    },
    {
        path: '/capture/endpoints/leadpages/new',
        component: components.get('page-capture-endpoints-leadpages-edit'),
        meta: {
            title: 'New Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/capture/endpoints/leadpages',
                    display: 'LeadPages Capture Endpoints',
                }
            ],
        }
    },
    {
        path: '/capture/endpoints/generic/new',
        component: components.get('page-capture-endpoints-generic-edit'),
        meta: {
            title: 'New Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/capture/endpoints/generic',
                    display: 'Generic Capture Endpoints',
                }
            ],
        }
    },
    {
        path: '/capture/endpoints/leadpages/:id',
        component: components.get('page-capture-endpoints-leadpages-edit'),
        meta: {
            title: 'Edit Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/capture/endpoints/leadpages',
                    display: 'LeadPages Capture Endpoints',
                }
            ],
        }
    },
    {
        path: '/capture/endpoints/generic/:id',
        component: components.get('page-capture-endpoints-generic-edit'),
        meta: {
            title: 'Edit Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/capture/endpoints/generic',
                    display: 'Generic Capture Endpoints',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/twilio/endpoints',
        component: components.get('page-marketing-sms-twilio-endpoints-index'),
        meta: {
            title: 'Twilio Endpoints',
            breadcrumbs: [],
        }
    },
    {
        path: '/marketing/sms/twilio/endpoints/new',
        component: components.get('page-marketing-sms-twilio-endpoints-edit'),
        meta: {
            title: 'New Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/marketing/sms/twilio/endpoints',
                    display: 'Twilio Endpoints',
                }
            ],
        }
    },
    {
        path: '/marketing/sms/twilio/endpoints/:id',
        component: components.get('page-marketing-sms-twilio-endpoints-edit'),
        meta: {
            title: 'Edit Capture Endpoint',
            breadcrumbs: [
                {
                    to: '/marketing/sms/twilio/endpoints',
                    display: 'Twilio Endpoints',
                }
            ],
        }
    },
    {
        path: '/marketing/email/proxies',
        component: components.get('page-marketing-email-proxies-index'),
        meta: {
            title: 'Proxies',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/proxies/new',
        component: components.get('page-marketing-email-proxies-add'),
        meta: {
            title: 'Create Proxies',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/proxies',
                    display: 'Proxies',
                }
            ],
        }
    },
    {
        path: '/marketing/email/proxies/:id',
        component: components.get('page-marketing-email-proxies-edit'),
        meta: {
            title: 'Edit a Proxy',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/proxies',
                    display: 'Proxies',
                }
            ],
        }
    },

    {
        path: '/marketing/email/accounts',
        component: components.get('page-marketing-email-accounts-index'),
        meta: {
            title: 'Email Accounts',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/accounts/new',
        component: components.get('page-marketing-email-accounts-add'),
        meta: {
            title: 'Create Email Accounts',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/accounts',
                    display: 'Email Accounts',
                }
            ],
        }
    },
    {
        path: '/marketing/email/accounts/:id',
        component: components.get('page-marketing-email-accounts-edit'),
        meta: {
            title: 'Edit an Email Account',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/accounts',
                    display: 'Email Accounts',
                }
            ],
        }
    },
    {
        path: '/marketing/email/blasts',
        component: components.get('page-marketing-email-queue-blasts'),
        meta: {
            title: 'Email Queue',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/blasts/:id',
        component: components.get('page-marketing-email-queue-blast-report'),
        meta: {
            title: 'Email Queue',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/blasts',
                    display: 'Email Blasts',
                }
            ],
        }
    },
    {
        path: '/marketing/email/queue',
        component: components.get('page-marketing-email-queue-index'),
        meta: {
            title: 'Email Queue',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '/marketing/email/queue/enqueue',
        component: components.get('page-marketing-email-queue-enqueue'),
        meta: {
            title: 'Enqueue Email Blast',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                },
                {
                    to: '/marketing/email/queue',
                    display: 'Email Queue',
                }
            ],
        }
    },
    {
        path: '/marketing/click/lookup',
        component: components.get('page-marketing-click-lookup'),
        meta: {
            title: 'View Click Details',
            breadcrumbs: [
                {
                    to: '/',
                    display: 'Dashboard',
                },
                {
                    to: '/marketing/',
                    display: 'Marketing',
                }
            ],
        }
    },
    {
        path: '*',
        component: components.get('page-404'),
        meta: {
            title: 'Page not Found',
        }
    }
];

const stringifyQueryObject = (query) => {
    const param = require('can-param');
    const stringified = param(query);
    let uri = '';
    if (null !== stringified && stringified.length > 0) {
        uri = `?${stringified}`;
    }
    return uri;
}

const parseQueryString = (querystring) => {
    querystring = querystring.substring(querystring.indexOf('?')+1);
    const deparam = require('can-deparam');
    return deparam(querystring);
}

const router = new VueRouter({
    routes,
    stringifyQuery: (query) => {
        return stringifyQueryObject(query);
    },
    parseQuery: (querystring) => {
        return parseQueryString(querystring);
    }
});

export default router