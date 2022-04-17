'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.group(() => {
    Route.get('/', 'ListController.list').middleware(['auth']);
    Route.get('/with-settings', 'ListController.listWithSettings').middleware(['auth']);
    Route.get('/processing', 'JobController.listProcessing').middleware(['auth']);
    Route.get('/completed', 'JobController.listCompleted').middleware(['auth']);
    Route.post('/upload', 'ListController.upload').middleware(['auth']);
    Route.get('/:id', 'ListController.get').middleware(['auth']);
    Route.get('/:id/preview', 'ListController.preview').middleware(['auth']);
    Route.post('/:id/preview', 'ListController.preview').middleware(['auth']);
    Route.post('/:id/settings', 'ListController.saveSettings').middleware(['auth']);
    Route.post('/:id/start', 'ListController.start').middleware(['auth']);
    Route.delete('/:id', 'ListController.delete').middleware(['auth']);
}).prefix('api/v1/lists');

Route.group(() => {
    Route.get('/:id', 'JobController.get').middleware(['auth']);
    Route.post('/:id/restart', 'JobController.restart').middleware(['auth']);
    Route.post('/:id/stop', 'JobController.stopJob').middleware(['auth']);
    Route.post('/:id/resume', 'JobController.resumeJob').middleware(['auth']);
    Route.post('/:id/cancel', 'JobController.cancelJob').middleware(['auth']);
}).prefix('api/v1/jobs');

Route.group(() => {
    Route.get('/', 'LeadController.list').middleware(['auth']);
    Route.post('/', 'LeadController.list').middleware(['auth']);
    Route.get('/scroll', 'LeadController.scrollingList').middleware(['auth']);
    Route.post('/scroll', 'LeadController.scrollingList').middleware(['auth']);
    Route.get('/preview-export', 'LeadController.previewExport').middleware(['auth']);
    Route.post('/preview-export', 'LeadController.previewExport').middleware(['auth']);
    Route.post('/export', 'LeadController.startExport').middleware(['auth']);
    Route.get('/exports', 'LeadController.listExports').middleware(['auth']);
    Route.get('/exports/api', 'LeadController.listApiExports').middleware(['auth']);
    Route.get('/exports/get-file-type-max', 'LeadController.getFileTypeMax').middleware(['auth']);
    Route.get('/:id', 'LeadController.getLead').middleware(['auth']);
    Route.post('/export/:id/restart', 'LeadController.restartExport').middleware(['auth']);
}).prefix('api/v1/leads');

Route.group(() => {
    Route.get('/field-mapping', 'SystemController.getLeadMapping').middleware(['auth']);
}).prefix('api/v1/system');

Route.group(() => {
    Route.get('/tags', 'DashboardController.getTags').middleware(['auth']);
    Route.get('/countries', 'DashboardController.getCountries').middleware(['auth']);
}).prefix('api/v1/dashboard');

Route.group(() => {
    Route.get('/daily', 'DashboardController.marketingGetDaily').middleware(['auth']);
    Route.get('/by-country', 'DashboardController.marketingGetByCountry').middleware(['auth']);
    Route.get('/clicks-last-hour', 'HasOffersClickController.getLastHourOfClicks');
    Route.get('/get-totals-for', 'DashboardController.getTotalsForKeys');
}).prefix('api/v1/marketing-dashboard');

Route.group(() => {
    Route.get('/vapid', 'PushController.getVapidConfig');
    Route.any('/subscribe', 'PushController.subscribe');
}).prefix('api/v1/push');

Route.group(() => {
    Route.get('/generate', 'SystemController.generateMFASecret').middleware(['auth']);
    Route.post('/save', 'SystemController.saveMFASecret').middleware(['auth']);
    Route.post('/verify', 'SystemController.verifyMFA').middleware(['auth']);
}).prefix('api/v1/mfa');

Route.group(() => {
    Route.get('/generate-url', 'OauthController.generateOauthRedirectUrl').middleware(['auth']);
}).prefix('api/v1/oauth');

Route.group(() => {
    Route.get('/jobs', 'TransferJobController.index').middleware(['auth']);
    Route.get('/google/files', 'TransferFromController.getGoogleFileList').middleware(['auth']);
    Route.get('/mega/files', 'TransferFromController.getMegaFileList').middleware(['auth']);
    Route.post('/start', 'TransferFromController.startTransfers').middleware(['auth']);
}).prefix('api/v1/transfer-from');


Route.group(() => {
    Route.get('/', 'ExportTemplateController.index').middleware(['auth']);
    Route.post('/', 'ExportTemplateController.create').middleware(['auth']);
    Route.get('/all', 'ExportTemplateController.all').middleware(['auth']);
    Route.get('/:id', 'ExportTemplateController.show').middleware(['auth']);
    Route.put('/:id', 'ExportTemplateController.update').middleware(['auth']);
}).prefix('api/v1/export-templates');

Route.group(() => {
    Route.get('/', 'ExportApiController.index').middleware(['auth']);
    Route.post('/', 'ExportApiController.create').middleware(['auth']);
    Route.get('/all', 'ExportApiController.all').middleware(['auth']);
    Route.get('/providers', 'ExportApiController.providers').middleware(['auth']);
    Route.get('/:id', 'ExportApiController.show').middleware(['auth']);
    Route.put('/:id', 'ExportApiController.update').middleware(['auth']);
}).prefix('api/v1/export-apis');

// apture Endpoints
Route.group(() => {
    Route.get('/', 'CaptureEndpointController.index').middleware(['auth']);
    Route.post('/', 'CaptureEndpointController.create').middleware(['auth']);
    Route.get('/:id', 'CaptureEndpointController.show').middleware(['auth']);
    Route.put('/:id', 'CaptureEndpointController.update').middleware(['auth']);
}).prefix('api/v1/capture-endpoints');


Route.group(() => {
    Route.get('/review', 'HasOffersClickController.listReview').middleware(['auth']);
    Route.get('/review/:scroll', 'HasOffersClickController.listReview').middleware(['auth']);
    Route.put('/review/click/:id', 'HasOffersClickController.updateClick').middleware(['auth']);
    Route.get('/emails', 'EmailMarketingController.listSupressedEmails').middleware(['auth']);
    Route.get('/domains', 'EmailMarketingController.listSupressedDomains').middleware(['auth']);
    Route.post('/populate/:list', 'EmailMarketingController.populateFromElasticsearch').middleware(['auth']);
}).prefix('api/v1/email/supressed');

Route.group(() => {
    Route.get('/', 'SmsProviderController.index').middleware(['auth']);
    Route.post('/', 'SmsProviderController.create').middleware(['auth']);
    Route.get('/all', 'SmsProviderController.all').middleware(['auth']);
    Route.get('/providers', 'SmsProviderController.providers').middleware(['auth']);
    Route.get('/:id', 'SmsProviderController.show').middleware(['auth']);
    Route.put('/:id', 'SmsProviderController.update').middleware(['auth']);
}).prefix('api/v1/marketing/sms/providers');

Route.group(() => {
    Route.get('/', 'MessageBlastController.sms_index').middleware(['auth']);
    Route.post('/', 'MessageBlastController.sms_create').middleware(['auth']);
    Route.get('/all', 'MessageBlastController.sms_all').middleware(['auth']);
    Route.get('/providers', 'MessageBlastController.providers').middleware(['auth']);
    Route.get('/:id', 'MessageBlastController.show').middleware(['auth']);
    Route.put('/:id', 'MessageBlastController.update').middleware(['auth']);
}).prefix('api/v1/marketing/sms/blasts');

Route.group(() => {
    Route.any('/:type', 'MarketingReportController.getReportData').middleware(['auth']);
}).prefix('api/v1/marketing/reports');

Route.group(() => {
    Route.get('/', 'ProxyController.index').middleware(['auth']);
    Route.post('/', 'ProxyController.create').middleware(['auth']);
    Route.get('/all', 'ProxyController.all').middleware(['auth']);
    Route.get('/:id', 'ProxyController.show').middleware(['auth']);
    Route.put('/:id', 'ProxyController.update').middleware(['auth']);
}).prefix('api/v1/marketing/email/proxies');

Route.group(() => {
    Route.get('/', 'EmailAccountController.index').middleware(['auth']);
    Route.post('/', 'EmailAccountController.create').middleware(['auth']);
    Route.get('/all', 'EmailAccountController.all').middleware(['auth']);
    Route.get('/:id', 'EmailAccountController.show').middleware(['auth']);
    Route.put('/:id', 'EmailAccountController.update').middleware(['auth']);
}).prefix('api/v1/marketing/email/accounts');

Route.group(() => {
    Route.get('/', 'EnqueuedEmailController.index').middleware(['auth']);
    Route.post('/', 'EnqueuedEmailController.create').middleware(['auth']);
    // Route.get('/all', 'EnqueuedEmailController.all').middleware(['auth']);
    // Route.get('/:id', 'EnqueuedEmailController.show').middleware(['auth']);
    // Route.put('/:id', 'EnqueuedEmailController.update').middleware(['auth']);
}).prefix('api/v1/marketing/email/queue');

Route.group(() => {
    Route.get('/', 'MessageBlastController.email_index').middleware(['auth']);
    Route.get('/:id', 'MessageBlastController.show').middleware(['auth']);
    Route.put('/:id', 'MessageBlastController.update').middleware(['auth']);
}).prefix('api/v1/marketing/email/blasts');

Route.group(() => {
    Route.post('/lookup', 'HasOffersClickController.internalClickSearch').middleware(['auth']);
}).prefix('api/v1/marketing/clicks');

Route.group(() => {
    Route.get('/', 'TwilioEndpointController.index').middleware(['auth']);
    Route.post('/', 'TwilioEndpointController.create').middleware(['auth']);
    Route.get('/:id', 'TwilioEndpointController.show').middleware(['auth']);
    Route.put('/:id', 'TwilioEndpointController.update').middleware(['auth']);
}).prefix('api/v1/twilio-endpoints');

Route.group(() => {
    Route.get('/ping', 'SystemController.ping');
    Route.get('/middleware', 'SystemController.middleware');
    Route.get('/tags', 'ListController.getTags').middleware(['auth']);
    Route.post('/login', 'AuthenticationController.login').middleware(['guest']);
    Route.post('/lock', 'AuthenticationController.lock').middleware(['auth']);
    Route.delete('/login', 'AuthenticationController.logout').middleware(['auth']);
    Route.post('/marketing/utilities/hasoffers/upload-click-report', 'HasOffersClickController.upload').middleware(['auth']);
    Route.any('*', 'SystemController.endpointNotFound');
}).prefix('api/v1');

Route.group(() => {
    Route.get('/google', 'OauthController.handleGoogleOAuthCode');
}).prefix('oauth');

Route.group(() => {
    Route.any('/generate', 'HasOffersClickController.generateClick');
}).prefix('clicks');

Route.group(() => {
    Route.any('/', 'ConversionController.captureGeneral');
    Route.any('/hasoffers', 'ConversionController.captureHasOffers');
    Route.any('/panda/:type/:tags', 'ConversionController.capturePanda');
    Route.any('/panda/:type/', 'ConversionController.capturePanda');
}).prefix('conversions/report');

Route.group(() => {
    Route.post('/panda-note', 'ConversionController.pushNoteToPanda');
}).prefix('conversions');

Route.group(() => {
    Route.any('/:hash', 'CaptureEndpointController.captureLeadPages');
}).prefix('capture/leadpages');

Route.group(() => {
    Route.any('/:hash', 'CaptureEndpointController.captureLeadPages');
}).prefix('capture/generic');

Route.group(() => {
    Route.any('/:hash/:type', 'TwilioEndpointController.handleIncoming');
}).prefix('twilio');

Route.get('/exports/:id', 'LeadController.downloadExport').middleware(['auth']);
Route.get('/manifest.json', 'SystemController.renderSPAManifest');
Route.get('/bastion/', 'SystemController.viewHandler');
Route.get('/privacy-policy/', 'SystemController.privacyHandler');
Route.any('*', 'SystemController.pwaHandler');