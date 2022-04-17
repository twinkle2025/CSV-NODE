<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Transfer from Mega.nz</h5>
        </div>
        <form action="javascript:false;" class="card-body">
            <form-wizard
                title=""
                subtitle=""
                color="#2196F3"
                errorColor="#F44336"
                finishButtonText="Start Transfer"
                @on-complete="startTransfer()"
                ref="wizard"
            >
                <tab-content title="Authentication" :before-change="hasAuthentication">
                    <div class="content d-flex justify-content-center align-items-center">
                        <div class="card mb-0">
                            <div class="card-body">
                                <div class="text-center mb-3">
                                    <p class="text-center"><img class="img-fluid" src="/assets/images/mega-logo.png" style="max-height:100px;" /></p>
                                    <h5 class="mb-0">Login to your Mega.nz Account</h5>
                                </div>
                                <div class="form-group form-group-feedback form-group-feedback-left">
                                    <input type="email" name="email" class="form-control" placeholder="Email Address" v-model="tmpAuth.username">
                                    <div class="form-control-feedback">
                                    <i class="icon-user text-muted"></i>
                                    </div>
                                </div>
                                <div class="form-group form-group-feedback form-group-feedback-left">
                                    <input type="password" name="password" class="form-control" placeholder="Password" v-model="tmpAuth.password">
                                    <div class="form-control-feedback">
                                    <i class="icon-lock2 text-muted"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </tab-content>
                <tab-content title="Choose Files" :before-change="hasSelectedFiles">
                    <external-file-list service="mega" :auth="auth" v-model="selectedFiles" @reauthenticate="authenticationExpired()" />
                </tab-content>
                <tab-content title="File Options">
                    <div class="form-group" v-for="(file, index) in selectedFiles" :key="index">
                        <label>Options for <code>{{JSON.parse(file).name}}</code></label>
                        <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <span class="input-group-text">Import Name</span>
                            </div>
                            <input :data-file-id="JSON.parse(file).id" class="form-control" :value="getFileNameParts(JSON.parse(file).name).name" @change="updateImportFileName(JSON.parse(file).id)">
                            <div class="input-group-append">
                                <span class="input-group-text">{{getFileNameParts(JSON.parse(file).name).extension[0]}}</span>
                            </div>
                        </div>
                    </div>
                </tab-content>
            </form-wizard>
        </form>
    </div>
</template>

<script>
    import {FormWizard, TabContent} from 'vue-form-wizard'
    import 'vue-form-wizard/dist/vue-form-wizard.min.css'
    export default {
        components: {
            FormWizard,
            TabContent,
        },
        data() {
            return {
                auth: {
                    username: null,
                    password: null
                },
                tmpAuth: {
                    username: null,
                    password: null
                },
                selectedFiles: [],
                fileOptions: {},
            }
        },
        mounted() {
        },
        methods: {
            updateImportFileName(id) {
                const newVal = jQuery(`[data-file-id="${id}"]`).val();
                if ('object' !== typeof(this.fileOptions[id])) {
                    this.fileOptions[id] = {};
                }
                this.fileOptions[id]['name'] = newVal;
            },
            getFileNameParts(name) {
                const re = /(?:\.([^.]+))?$/;
                const ext = re.exec(name);
                const nam = name.substring(0, ((name.length - ext[0].length)));
                return {
                    extension: ext,
                    name: nam
                };
            },
            async hasAuthentication() {
                const valid = (null !== this.tmpAuth.username && null !== this.tmpAuth.password);
                if (!valid) {
                    await swal({
                        title: 'Error',
                        text: 'You must be enter your login credentials to continue',
                        type: 'error',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-primary',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: true,
                    });
                } else {
                    this.auth = this.tmpAuth;
                }
                return valid;
            },
            authenticationExpired() {
                this.auth.username = null;
                this.auth.password = null;
                this.$refs.wizard.changeTab(1,0);
            },
            async hasSelectedFiles() {
                const valid = (this.selectedFiles.length > 0);
                if (!valid) {
                    await swal({
                        title: 'Error',
                        text: 'You must select a file to continue',
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
            async startTransfer() {
                await swal({
                    title: 'Confirmation',
                    text: 'Are you sure that you want to start transferring these files? Once started, the transfer cannot be stopped.',
                    type: 'question',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: 'Yes'
                }).then(async (result) => {
                    if (result.value) {
                        swal({
                            title: 'Processing',
                            text: 'Please wait while the transfers are initialized',
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
                        axios.post('/transfer-from/start', {
                            service: 'google',
                            auth: this.authtoken,
                            files: this.selectedFiles,
                            options: this.fileOptions
                        }).then( (response) => {
                            swal({
                                title: 'Success',
                                text: 'Started File Transfers Successfully',
                                type: 'success',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-success',
                                cancelButtonClass: 'btn btn-primary',
                                showCancelButton: false,
                                confirmButtonText: 'OK',
                                cancelButtonText: 'Close'
                            }).then( async (result) => {
                                this.$router.push('/transfer-from/jobs');
                            })
                        })
                        .catch( (error) => {
                            swal.close();
                            handleAxiosError(error);
                        });      
                    }
                })
            }
        }
    }
</script>