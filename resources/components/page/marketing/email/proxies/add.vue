<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Add Proxies</h5>
        </div>
        <div class="card-body">
            <form-wizard
                title=""
                subtitle=""
                color="#2196F3"
                errorColor="#F44336"
                finishButtonText="Add Proxies"
                @on-complete="addProxies()"
                ref="wizard"
            >
                <tab-content title="Upload Spreadsheet" :before-change="hasProxies">
                    <input type="file" name="file" :id="`file-upload-${_uid}`" class="d-none" />
                    <p class="text-muted">Please upload a spreadsheet with the following columns:</p>
                    <div class="table-responsive text-nowrap mb-3">
                        <table class="table table-bordered table-stripped table-hover table-xs">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Host</th>
                                    <th>Port</th>
                                    <th>Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Optional</td>
                                </tr>
                                <tr>
                                    <td><code>http</code></td>
                                    <td><code>localhost</code></td>
                                    <td><code>1080</code></td>
                                    <td><code>1</code></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        <button class="btn btn-dark" role="button" type="button" :id="`file-upload-button-${_uid}`"><i class="icon-file-spreadsheet2 mr-1"></i>Upload Spreadsheet</button>
                    </p>
                    <p class="text-muted">Once parsed correctly, you will be notified.</p>
                </tab-content>
                <tab-content title="Add Proxies" :before-change="hasProxies">
                    <div class="table-responsive text-nowrap mb-3">
                        <table class="table table-bordered table-stripped table-hover table-xs">
                            <thead>
                                <tr>
                                    <th>&nbsp;</th>
                                    <th>Type</th>
                                    <th>Host</th>
                                    <th>Port</th>
                                    <th>Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(proxy, key, index) in proxies" :key="index">
                                    <td class="p-0 text-center">
                                        <button class="btn btn-danger btn-sm" @click="removeProxy(key)">
                                            <i class="icon-trash"></i>
                                        </button>
                                    </td>
                                    <td class="p-0">
                                        <select class="form-control form-control-sm" v-model="proxies[key].type">
                                            <option value="http">HTTP</option>
                                            <option value="socks4">SOCKS4</option>
                                            <option value="socks5">SOCKS5</option>
                                        </select>
                                    </td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="proxies[key].host" /></td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="proxies[key].port" /></td>
                                    <td class="p-0 text-center"><input type="checkbox" class="form-control form-control-sm" v-model="proxies[key].active" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </tab-content>
            </form-wizard>
        </div>
    </div>
</template>

<script>
    import XLSX from 'xlsx';
    import {FormWizard, TabContent} from 'vue-form-wizard'
    import 'vue-form-wizard/dist/vue-form-wizard.min.css'
    export default {
        components: {
            FormWizard,
            TabContent,
        },
        data() {
            return {
                proxies: {},
                btn: null,
                file: null,
            }
        },
        async mounted() {
            this.btn = jQuery(`#file-upload-button-${this._uid}`);
            this.file = jQuery(`#file-upload-${this._uid}`);
            this.btn.on('click', () => {
                this.file.trigger('click');
            });
            this.file.on('change', this.handleFile);
        },
        methods: {
            removeProxy(id) {
                delete this.proxies[id];
                this.$forceUpdate();
            },
            async hasProxies() {
                const valid = (Object.keys(this.proxies).length > 0);
                if (!valid) {
                    await swal({
                        title: 'Error',
                        text: 'You must upload a list of proxies to continue',
                        type: 'error',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-primary',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: true,
                    });
                }
                return valid;
            },
            handleFile(e) {
                const files = e.target.files;
                const f = files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    swal({
                        title: 'Processing',
                        text: 'Your file is being processed. Please wait.',
                        type: 'info',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-primary',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                    });
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const first_sheet_name = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[first_sheet_name];
                    const json = XLSX.utils.sheet_to_json(sheet, {header: 1});
                    const pl = new Set();
                    if (Array.isArray(json)) {
                        for (let i = 0; i < json.length; i++) {
                            const row = json[i];
                            const proxy = {
                                type: null,
                                host: null,
                                port: null,
                                active: true,
                            }
                            if (row.length === 3) {
                                proxy.type = row[0];
                                proxy.host = row[1];
                                proxy.port = (isNaN(row[2])) ? null : parseInt(row[2]);
                            }
                            else if (row.length === 4) {
                                proxy.type = row[0];
                                proxy.host = row[1];
                                proxy.port = (isNaN(row[2])) ? null : parseInt(row[2]);
                                proxy.active = (true == row[3]);
                            }
                            if (
                                null !== proxy.type
                                && null !== proxy.host
                                && null !== proxy.port
                            ) {
                                pl.add(proxy);
                            }
                        }
                        let count = 0;
                        pl.forEach( (val, key) => {
                            this.proxies[`${count}`] = val;
                            count ++;
                        })
                        if (Object.keys(this.proxies).length > 0) {
                            await swal({
                                title: 'Spreadsheet Processed',
                                text: 'You may now continue to the next step',
                                type: 'success',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-primary',
                                cancelButtonClass: 'btn btn-light',
                                showCancelButton: false,
                                showConfirmButton: true,
                            });
                            this.$forceUpdate();
                        }
                        else {
                            await swal({
                                title: 'Error',
                                text: 'No valid proxies could be mapped',
                                type: 'error',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-primary',
                                cancelButtonClass: 'btn btn-light',
                                showCancelButton: false,
                                showConfirmButton: true,
                            });
                        }
                    } else {
                        await swal({
                            title: 'Error',
                            text: 'Unable to parse spreadsheet. Please check your file format and try again.',
                            type: 'error',
                            buttonsStyling: false,
                            confirmButtonClass: 'btn btn-primary',
                            cancelButtonClass: 'btn btn-light',
                            showCancelButton: false,
                            showConfirmButton: true,
                        });
                    }
                    this.file.val('');
                };
                reader.readAsArrayBuffer(f);
            },
            async addProxies() {
                swal({
                    title: 'Processing',
                    text: 'Your proxies are being saved. Please wait.',
                    type: 'info',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                });
                const promises = [];
                for (let key in this.proxies) {
                    const proxy = this.proxies[key];
                    promises.push(this.saveProxy(proxy));
                }
                await Promise.all(promises);
                const value = await swal({
                    title: 'Success',
                    text: 'All Proxies Submitted. You will receive notificatons of success or failure.',
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Fantastic!'
                });
                if (value) {
                    this.$router.push('/marketing/email/proxies/');
                }
            },
            async saveProxy(proxy) {
                const url = '/marketing/email/proxies/';
                const method = 'post';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: proxy,
                    });
                    PNotify.success({
                        title: 'Success',
                        text: `Added Proxy ${proxy.type}://${proxy.host}:${proxy.port} Successfully`,
                        type: 'success'
                    });
                } catch (error) {
                    PNotify.warning({
                        title: 'Failure',
                        text: `Failed to Add Proxy ${proxy.type}://${proxy.host}:${proxy.port}`,
                        type: 'warning'
                    });
                    handleAxiosError(error);
                }
            }
        },
    }
</script>