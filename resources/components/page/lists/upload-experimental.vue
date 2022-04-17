<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Experimental File Uploader</h5>
        </div>
        <div class="card-body">
            <p class="mb-3">You may upload the following file types:</p>
            <ul>
                <li><code>.csv</code></li>
                <li><code>.txt</code></li>
                <li><code>.xls</code></li>
                <li><code>.xlsx</code></li>
            </ul>
            <form id="form">
                <div class="form-group">
                    <div class="input-group">
                        <input type="file" id="file" class="form-control h-auto" multiple accept="text/csv, text/plain, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/CDFV2" />
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="submit" role="submit">Upload Files</button>
                        </div>
                    </div>
                </div>
            </form>
            <div class="table-responsive" v-if="Object.keys(uploads).length > 0">
                <table class="table table-hover table-sm table-bordered mb-0">
                    <thead>
                        <tr>
                            <th>&nbsp;</th>
                            <th>File Name</th>
                            <th>Upload Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(fileInfo, uploadId, index) in uploads" :key="index">
                            <td class="pt-0 pb-0 pl-1 pr-1 text-center" style="width: calc(37px + 2rem);">
                                <button v-if="getFilePercentage(fileInfo) < 100" class="btn btn-sm btn-danger" role="button" type="button" @click="abortUpload(uploadId)"><i class="fas fa-trash"></i></button>
                            </td>
                            <td>{{fileInfo.name}}</td>
                            <td>
                                <div class="progress mb-0">
                                    <div class="progress-bar  " role="progressbar" :style="`width: ${getFilePercentage(fileInfo)}%`" :aria-valuenow="getFilePercentage(fileInfo)" aria-valuemin="0" aria-valuemax="100">{{getFilePercentage(fileInfo)}}%</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import SocketIOFileClient from 'socket.io-file-client';
    import socket from '../../../js/socket.io';
    export default {
        beforeDestroy() {
            this.uploader.destroy();
        },
        data() {
            return {
                uploader: new SocketIOFileClient(socket),
                form: null,
                uploads: {},
            }
        },
        mounted() {
            this.form = document.getElementById('form');
            this.uploader.on('start', (fileInfo) => {
                this.uploads[fileInfo.uploadId] = fileInfo;
                this.form.reset();
                this.$forceUpdate();
            });
            this.uploader.on('stream', (fileInfo) => {
                //console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
                this.uploads[fileInfo.uploadId] = fileInfo;
                this.$forceUpdate();
            });
            this.uploader.on('complete', (fileInfo) => {
                //console.log('Upload Complete', fileInfo);
                this.uploads[fileInfo.uploadId] = fileInfo;
                this.$forceUpdate();
            });
            this.uploader.on('error', (err) => {
                //console.log('Error!', err);
                PNotify.danger({
                    title: 'File Upload Failed',
                    text: err.toString(),
                    type: 'danger'
                });
            });
            this.uploader.on('abort', (fileInfo) => {
                //console.log('Aborted: ', fileInfo);
                delete this.uploads[fileInfo.uploadId];
                this.$forceUpdate();
            });
            this.form.onsubmit = (ev) => {
                ev.preventDefault();
                var fileEl = document.getElementById('file');
                var uploadIds = this.uploader.upload(fileEl);
            };
        },
        methods: {
            getFilePercentage(fileInfo) {
                let float;
                if ('undefined' !== typeof(fileInfo.wrote)) {
                    float = fileInfo.wrote / fileInfo.size;
                } else {
                    float = fileInfo.sent / fileInfo.size;
                }
                return parseFloat(float * 100).toFixed(0);
            },
            abortUpload(id) {
                this.uploader.abort(id);
            }
        }
    }
</script>