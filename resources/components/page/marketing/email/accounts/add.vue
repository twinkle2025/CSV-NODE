<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Add Accounts</h5>
        </div>
        <div class="card-body">
            <form-wizard
                title=""
                subtitle=""
                color="#2196F3"
                errorColor="#F44336"
                finishButtonText="Add Accounts"
                @on-complete="addAccounts()"
                ref="wizard"
            >
                <tab-content title="Upload Spreadsheet" :before-change="hasAccounts">
                    <input type="file" name="file" :id="`file-upload-${_uid}`" class="d-none" />
                    <p class="text-muted">Please upload a spreadsheet with the following columns:</p>
                    <div class="table-responsive text-nowrap mb-3">
                        <table class="table table-bordered table-stripped table-hover table-xs">
                            <thead>
                                <tr>
                                    <th>Email Address</th>
                                    <th>Sender Name</th>
                                    <th>SMTP Host</th>
                                    <th>SMTP Port</th>
                                    <th>SMTP User</th>
                                    <th>SMTP Password</th>
                                    <th>Encryption</th>
                                    <th>Hourly Cap</th>
                                    <th>Daily Cap</th>
                                    <th>Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Required</td>
                                    <td>Optional</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Required</td>
                                    <td>Optional</td>
                                </tr>
                                <tr>
                                    <td><code>foo@example.com</code></td>
                                    <td><code>Fred Foo</code></td>
                                    <td><code>smtp.ethereal.email</code></td>
                                    <td><code>587</code></td>
                                    <td><code>user</code></td>
                                    <td><code>password</code></td>
                                    <td><code>tls</code></td>
                                    <td><code>100</code></td>
                                    <td><code>500</code></td>
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
                <tab-content title="Add Accounts" :before-change="hasAccounts">
                    <div class="table-responsive text-nowrap mb-3">
                        <table class="table table-bordered table-stripped table-hover table-xs">
                            <thead>
                                <tr>
                                    <th>&nbsp;</th>
                                    <th>Email Address</th>
                                    <th>Sender Name</th>
                                    <th>SMTP Host</th>
                                    <th>SMTP Port</th>
                                    <th>SMTP User</th>
                                    <th>SMTP Password</th>
                                    <th>Encryption</th>
                                    <th>Hourly Cap</th>
                                    <th>Daily Cap</th>
                                    <th>Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(account, key, index) in accounts" :key="index">
                                    <td class="p-0 text-center">
                                        <button class="btn btn-danger btn-sm" @click="removeAccount(key)">
                                            <i class="icon-trash"></i>
                                        </button>
                                    </td>
                                    <td class="p-0"><input type="email" class="form-control form-control-sm" v-model="accounts[key].email" /></td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="accounts[key].name" /></td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="accounts[key].host" /></td>
                                    <td class="p-0"><input type="number" min="1" max="6500" class="form-control form-control-sm" v-model="accounts[key].port" /></td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="accounts[key].user" /></td>
                                    <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="accounts[key].password" /></td>
                                    <td class="p-0">
                                        <select class="form-control form-control-sm" v-model="accounts[key].encryption">
                                            <option value="none">None</option>
                                            <option value="ssl">SSL</option>
                                            <option value="tls">TLS</option>
                                        </select>
                                    </td>
                                    <td class="p-0"><input type="number" min="-1" class="form-control form-control-sm" v-model="accounts[key].max_hourly" /></td>
                                    <td class="p-0"><input type="number" min="-1" class="form-control form-control-sm" v-model="accounts[key].max_daily" /></td>
                                    <td class="p-0 text-center"><input type="checkbox" class="form-control form-control-sm" v-model="accounts[key].active" /></td>
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
                accounts: {},
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
            removeAccount(id) {
                delete this.accounts[id];
                this.$forceUpdate();
            },
            async hasAccounts() {
                const valid = (Object.keys(this.accounts).length > 0);
                if (!valid) {
                    await swal({
                        title: 'Error',
                        text: 'You must upload a list of accounts to continue',
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
                            const account = {
                                email: null,
                                name: null,
                                host: null,
                                port: null,
                                user: null,
                                password: null,
                                encryption: null,
                                max_hourly: null,
                                max_daily: null,
                                active: true,
                            }
                            if (row.length === 9) {
                                account.email = row[0];
                                account.name = row[1];
                                account.host = row[2];
                                account.port = (isNaN(row[3])) ? null : parseInt(row[3]);
                                account.user = row[4];
                                account.password = row[5];
                                account.encryption = row[6];
                                account.max_hourly = row[7];
                                account.max_daily = row[8];
                            }
                            else if (row.length === 10) {
                                account.email = row[0];
                                account.name = row[1];
                                account.host = row[2];
                                account.port = (isNaN(row[3])) ? null : parseInt(row[3]);
                                account.user = row[4];
                                account.password = row[5];
                                account.encryption = row[6];
                                account.max_hourly = row[7];
                                account.max_daily = row[8];
                                account.active = (true == row[9]);
                            }
                            if (
                                null !== account.email
                                && null !== account.name
                                && null !== account.host
                                && null !== account.port
                                && null !== account.user
                                && null !== account.password
                                && null !== account.encryption
                                && null !== account.max_hourly
                                && null !== account.max_daily
                            ) {
                                pl.add(account);
                            }
                        }
                        let count = 0;
                        pl.forEach( (val, key) => {
                            this.accounts[`${count}`] = val;
                            count ++;
                        })
                        if (Object.keys(this.accounts).length > 0) {
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
                                text: 'No valid accounts could be mapped',
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
            async addAccounts() {
                swal({
                    title: 'Processing',
                    text: 'Your accounts are being saved. Please wait.',
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
                for (let key in this.accounts) {
                    const account = this.accounts[key];
                    promises.push(this.saveAccount(account));
                }
                await Promise.all(promises);
                const value = await swal({
                    title: 'Success',
                    text: 'All Accounts Submitted. You will receive notificatons of success or failure.',
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Fantastic!'
                });
                if (value) {
                    this.$router.push('/marketing/email/accounts/');
                }
            },
            async saveAccount(account) {
                const url = '/marketing/email/accounts/';
                const method = 'post';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: account,
                    });
                    PNotify.success({
                        title: 'Success',
                        text: `Added Account ${account.email} via ${account.host} Successfully`,
                        type: 'success'
                    });
                } catch (error) {
                    PNotify.warning({
                        title: 'Failure',
                        text: `Failed to Add Account ${account.email} via ${account.host}`,
                        type: 'warning'
                    });
                    handleAxiosError(error);
                }
            }
        },
    }
</script>