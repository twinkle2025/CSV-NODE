'use strict'

const { validate } = use('Validator');
const Config = use('Config');
const Helpers = use('Helpers');
require('newrelic');

class TransferFromController {
    async getGoogleFileList({request, response}) {
        const rules = {
            token: 'required|string',
            pageToken: 'string',
            search: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        const {google} = require('googleapis');
        try {
            const oauth2Client = new google.auth.OAuth2(
                Config.get('oauth.google.client'),
                Config.get('oauth.google.secret'),
                this.makeRedirectForOauth('google')
            );
            const tokens = JSON.parse(request.input('token'));
            oauth2Client.setCredentials(tokens);
            const drive = google.drive({version: 'v3', auth: oauth2Client});
            let query = "(mimeType='text/csv' or mimeType='text/plain' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/CDFV2')";
            if ('string' === typeof(request.input('search')) && request.input('search').length > 0) {
                query += ` and name contains '${request.input('search')}'`;
            }
            const list = await drive.files.list({
                pageSize: 12,
                fields: 'nextPageToken, files(id, name, iconLink, webViewLink, thumbnailLink)',
                //fields: 'nextPageToken, files(*)',
                pageToken: request.input('pageToken'),
                q: query,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });
            return response.api(200, {
                nextPageToken: list.data.nextPageToken,
                fileList: list.data.files
            });
        } catch (error) {
            console.warn(error);
            return response.api(400, null, [{message: error.toString()}]);
        }
        return response.api(503, null, [{message: "Debug"}]);
    }

    async getMegaFileList({request, response}) {
        const rules = {
            email: 'required|email',
            password: 'required|string',
            //pageToken: 'string',
            search: 'string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            //return response.api(400, null, validation.messages());
            return response.api(400, null, [{message: 'invalidAuth'}]);
        }
        const mega = require('mega');
        try {
            const storage = mega({
                email: request.input('email'),
                password: request.input('password'),
                keepalive: true,
                autoload: true
            });
            storage.on('ready', () => {
                console.log('Mega has Loaded');
                for (var id in storage.files) {
                    var f = storage.files[id]
                    if (!f.directory) {
                        console.log(f);
                    }
                  }
            });
        } catch (error) {
            console.warn(error);
            return response.api(400, null, [{message: error.toString()}]);
        }
        return response.api(503, null, [{message: "Debug"}]);
    }

    async startTransfers({request, response}) {
        const TransferJob = use('App/Models/TransferJob');
        const rules = {
            service: 'required|string',
            auth: 'required',
            files: 'required',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        let auth = request.input('auth');
        if ('object' !== typeof(auth)) {
            auth = JSON.parse(auth);
        }
        const files = request.input('files');
        const options = request.input('options');
        const jobs = [];
        const errors = [];
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if ('object' !== typeof(file)) {
                file = JSON.parse(file);
            }
            const job = new TransferJob;
            job.status = 'new';
            job.service = request.input('service');
            job.auth = auth;
            job.options = file;
            job.imported_bytes = 0;
            job.name = this.getFileName(file, options);
            job.tmp_path = Helpers.tmpPath(`transfers/${job.name}`);
            try {
                await job.save();
                jobs.push(job);
                /**
                 * OK, the job has been created
                 * Start the job in a seperate thread
                 */
                this.spawnForkForJob(job.id);
            } catch (error) {
                errors.push({message: `Failed to create transfer for ${job.name}, ${error.toString()}`});
                console.warn(error);
            }
        }
        if (jobs.length === 0 && errors.length > 0) {
            return response.api(500, null, errors);
        }
        return response.api(201, jobs);
    }

    makeRedirectForOauth(service) {
        const Env = use('Env')
        return Env.get('APP_URL', `${Env.get('HOST', '127.0.0.1')}:${Env.get('PORT', 3333)}`) + `/oauth/${service}`;
    }

    getFileName(file, options) {
        const id = file.id;
        let name = file.name;
        if ('object' === typeof(options[id]) && 'string' === typeof(options[id].name)) {
            const parts = this.getFileNameParts(file.name);
            name = `${options[id].name}${parts.extension[0]}`;
        }
        return name;
    }

    getFileNameParts(name) {
        const re = /(?:\.([^.]+))?$/;
        const ext = re.exec(name);
        const nam = name.substring(0, ((name.length - ext[0].length)));
        return {
            extension: ext,
            name: nam
        };
    }

    async spawnForkForJob(id) {
        const {enqueue} = require('../../Services/queue');
        enqueue('transfer', id);
    }

    async processTransfer(job) {
        job.status = 'downloading';
        await job.save();
        let loopId;
        switch(job.service) {
            case 'google':
                await this.processTransferFromGoogleDrive(job, () => {
                    loopId = setInterval(async () => {
                        job.imported_bytes = this.getFileSize(job.tmp_path);
                        await job.save();
                    }, 500)
                }, async () => {
                    clearInterval(loopId);
                    job.imported_bytes = this.getFileSize(job.tmp_path);
                    await job.save();
                });
                break;

            default:
                job.status = 'failed';
                await job.save();
                return;
        }
    }

    getFileSize(file, callback) {
        const fs = require("fs");
        try {
            const stats = fs.statSync(file);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    async processTransferFromGoogleDrive(job, scb, cb) {
        if ('function' === typeof(scb)) {
            scb();
        }
        console.log('Download Starting');
        try {
            const fs = require("fs");
            const mkdirp = require('mkdirp');
            const {google} = require('googleapis');
            const oauth2Client = new google.auth.OAuth2(
                Config.get('oauth.google.client'),
                Config.get('oauth.google.secret'),
                this.makeRedirectForOauth('google')
            );
            oauth2Client.setCredentials(job.auth);
            const drive = google.drive({version: 'v3', auth: oauth2Client});
            await mkdirp(Helpers.tmpPath(`transfers`));
            const dest = fs.createWriteStream(job.tmp_path);
            let progress = 0;
            const res = await drive.files.get({
                fileId: job.options.id,
                alt: 'media',
                //acknowledgeAbuse: true,
            }, {responseType: 'stream'});
            res.data
            .on('end', async () => {
                if ('function' === typeof(cb)) {
                    cb();
                }
                job.status = 'transfered';
                console.log('Download Ended');
                await job.save();
                const result = await this.storeTransferedFile(job);
                if (result) {
                    console.log('Transferred File Successfully');
                    process.exit();
                } else {
                    console.warn('File Storage for Transferred File Failed');
                    process.exit();
                }
            })
            .on('error', async (error) => {
                if ('function' === typeof(cb)) {
                    cb();
                }
                console.warn('Error during download', error);
                job.status = 'failed';
                await job.save();
                process.exit();
            })
            .on('data', d => {
                progress += d.length;
                console.log(`Downloaded ${progress} bytes`);
            })
            .pipe(dest);
        } catch (error) {
            console.warn('Caught error', error);
            job.status = 'failed';
            await job.save();
            if ('function' === typeof(cb)) {
                cb();
            }
            process.exit();
        }
    }

    async storeTransferedFile(job) {
        /**
         * This is where we move the file to the file store and save the record in the DB
         */
        const File = use('App/Models/File');
        const Drive = use('Drive');
        const md5 = require('md5');
        const parts = this.getFileNameParts(job.name);
        const f = new File;
        f.name = job.name;
        f.drive = Config.get('drive.disk');
        f.key = md5(`${job.name} ${Math.random()}`);
        f.path = `lists/${f.key}.${parts.extension[1]}`;
        const currentPath = `transfers/${f.name}`;
        if ('local' === f.drive) {
            const moved = await Drive.disk('local').move(currentPath, f.path);
            if (true === moved) {
                await f.save();
                return true;
            } else {
                throw new Error("Unable to save file");
            }
        } else {
            const currentFile = await Drive.get(currentPath);
            const moved = await Drive.disk('s3').put(f.path, currentFile);
            if (true === moved) {
                await f.save();
                Drive.disk('local').delete(currentPath);
                return true;
            } else {
                throw new Error("Unable to save file");
            }
        }
    }
}

module.exports = TransferFromController
