<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Transfer from Google Drive</h5>
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
                    <p class="text-muted">Please login to the Google Drive account which has access to the files you wish to transfer.</p>
                    <p>
                        <button class="btn btn-dark" role="button" type="button" @click="redirectToExternalAuth()"><i class="fab fa-google mr-1"></i>Login to your Google Account </button>
                    </p>
                    <p class="text-muted">Once login has been completed, click next.</p>
                </tab-content>
                <tab-content title="Choose Files" :before-change="hasSelectedFiles">
                    <external-file-list service="google" :auth="authtoken" v-model="selectedFiles" @reauthenticate="authenticationExpired()" />
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
                authtoken: null,
                selectedFiles: [],
                fileOptions: {},
            }
        },
        mounted() {
            if ('object' === typeof(this.$route.query) && 'string' === typeof(this.$route.query.token)) {
                try {
                    this.authtoken = JSON.parse(this.$route.query.token);
                    this.$refs.wizard.changeTab(0,1);
                } catch (error) {
                    console.warn(error);
                }
            }
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
                const valid = (null !== this.authtoken);
                if (!valid) {
                    await swal({
                        title: 'Error',
                        text: 'You must be authenticated to continue',
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
            authenticationExpired() {
                this.authtoken = null;
                this.$refs.wizard.changeTab(1,0);
            },
            async redirectToExternalAuth() {
                swal({
                    title: 'Retrieving Redirect Link',
                    text: 'Please wait while the redirection link is generated',
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
                try {
                    const response = await axios.get('/oauth/generate-url?service=google');
                    window.location.href = response.data.body;
                    swal({
                        title: 'You are being redirected',
                        text: 'Please wait while you are redirected to the login page',
                        type: 'success',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-primary',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                    });
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
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