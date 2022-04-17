const SocketIOFile = require('socket.io-file');
const { validate, sanitizor } = use('Validator');
const Helpers = use('Helpers');
const Config = use('Config');
const File = use('App/Models/File');
const ImportSetting = use('App/Models/ImportSetting');
const ImportJob = use('App/Models/ImportJob');
const md5 = require('md5');
const Drive = use('Drive');
const moment = require('moment-timezone');

const getFileExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (-1 === lastDot) {
        return '';
    }
    return filename.substring(lastDot + 1);
}

const init = async(socket) => {
    const uploader = new SocketIOFile(socket, {
        uploadDir: Helpers.tmpPath('uploads'),
        accepts: ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/CDFV2'],
        overwrite: true,
    });
    uploader.on('start', (fileInfo) => {
        socket.emit('file-upload-started', fileInfo);
    });
    uploader.on('stream', (fileInfo) => {
        socket.emit('file-upload-progress', fileInfo);
    });
    uploader.on('complete', async (fileInfo) => {
        const relativePath = fileInfo.uploadDir.replace(`${Helpers.tmpPath()}/`, '');
        const extension = getFileExtension(fileInfo.name);
        const f = new File;
        f.name = fileInfo.name;
        f.drive = Config.get('drive.disk');
        f.key = md5(`${fileInfo.name} ${Math.random()}`);
        f.path = `lists/${f.key}.${extension}`;

        if ('local' === f.drive) {
            const moved = await Drive.disk('local').move(relativePath, f.path);
            if (true === moved) {
                f.save();
                socket.emit('file-upload-complete', fileInfo);
            } else {
                socket.emit('file-upload-failed', fileInfo);      
            }
        } else {
            const currentFile = await Drive.get(relativePath);
            const moved = await Drive.disk('s3').put(f.path, currentFile);
            if (true === moved) {
                f.save();
                socket.emit('file-upload-complete', fileInfo);
                Drive.disk('local').delete(relativePath);
            } else {
                socket.emit('file-upload-failed', fileInfo);      
            }
        }

    });
    uploader.on('error', (err) => {
        console.log('Error!', err);
    });
    uploader.on('abort', (fileInfo) => {
        socket.emit('file-upload-aborted', fileInfo);
    });
}

module.exports = init;