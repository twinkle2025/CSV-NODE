<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Setup Import Settings for Multiple Files</h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="!error">
                <h6>Configure Column Settings</h6>
                <div class="btn-group btn-group-sm mb-3" role="group">
                    <button class="btn btn-outline-dark" role="button" type="button" @click="addNewColumn()" v-if="!loading">Add New Column</button>
                    <button class="btn btn-outline-primary" role="button" type="button" @click="loadPreview()" v-if="!loading">Refresh Previews</button>
                    <button class="btn btn-outline-success" role="button" type="button" @click="submitForm()" v-if="!loading">Save Import Settings</button>
                </div>
                <div class="table-responsive mb-3" v-if="null !== master_settings">
                    <table class="table table-bordered table-stripped table-hover table-xs text-nowrap file-preview-table">
                        <thead>
                            <tr>
                                <th>
                                    Column
                                </th>
                                <th v-for="(column, index) in master_settings.column_settings" :key="index" class="text-center"><code>{{index}}</code></th>
                            </tr>
                            <tr>
                                <th>Field Name</th>
                                <th v-for="(column, index) in master_settings.column_settings" :key="index">
                                    <div class="input-group">
                                        <input type="text" class="form-control" v-model="master_settings.column_settings[index].name" />
                                        <div class="input-group-append">
                                            <button type="button" class="btn btn-light dropdown-toggle btn-icon" data-toggle="dropdown" aria-expanded="false"></button>
                                            <div class="dropdown-menu dropdown-menu-right" style="max-height:187px; overflow-y: scroll;">
                                                <a :href="window.location.href" @click="setFieldName(index, 'fname')" class="dropdown-item">First Name</a>
                                                <a :href="window.location.href" @click="setFieldName(index, 'lname')" class="dropdown-item">Last Name</a>
                                                <a :href="window.location.href" @click="setFieldName(index, 'email')" class="dropdown-item">Email Address</a>
                                                <a :href="window.location.href" @click="setFieldName(index, 'phone')" class="dropdown-item">Phone Number</a>
                                                <a :href="window.location.href" @click="setFieldName(index, 'country')" class="dropdown-item">Country</a>
                                                <a v-for="(name, i) in mapping" :key="i" :href="window.location.href" @click="setFieldName(index, name)" class="dropdown-item"><code>{{name}}</code></a>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th>Field Type</th>
                                <th v-for="(column, index) in master_settings.column_settings" :key="index">
                                    <select class="form-control" v-model="master_settings.column_settings[index].type">
                                        <option value="general">General</option>
                                        <option value="name">Name</option>
                                        <option value="fullname">Full Name</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone Number</option>
                                        <option value="leadpagesphone">LeadPages Phone Number</option>
                                        <option value="country">Country</option>
                                        <option value="date">Date</option>
                                        <option value="datetime">Date/Time</option>
                                        <option value="ip">IP Address</option>
                                        <option value="boolean">Boolean</option>
                                    </select>
                                </th>
                            </tr>
                            <tr>
                                <th>Default Value</th>
                                <th v-for="(column, index) in master_settings.column_settings" :key="index">
                                    <div class="input-group">
                                        <input type="text" class="form-control" v-model="master_settings.column_settings[index].options.default" />
                                        <div class="input-group-append">
                                            <button type="button" class="btn btn-light dropdown-toggle btn-icon" data-toggle="dropdown" aria-expanded="false"></button>
                                            <div class="dropdown-menu dropdown-menu-right">
                                                <a :href="window.location.href" @click="setFieldOption(index, 'default', 'null')" class="dropdown-item"><code>NULL</code></a>
                                                <a :href="window.location.href" @click="setFieldOption(index, 'default', 'true')" class="dropdown-item" v-if="['boolean'].indexOf(master_settings.column_settings[index].type) > -1"><code>TRUE</code></a>
                                                <a :href="window.location.href" @click="setFieldOption(index, 'default', 'false')" class="dropdown-item" v-if="['boolean'].indexOf(master_settings.column_settings[index].type) > -1"><code>FALSE</code></a>
                                                <a :href="window.location.href" @click="setFieldOption(index, 'default', 'NOW()')" class="dropdown-item" v-if="['date', 'datetime'].indexOf(master_settings.column_settings[index].type) > -1"><code>NOW()</code></a>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr v-if="needsFormat">
                                <th>Format</th>
                                <th v-for="(column, index) in master_settings.column_settings" :key="index">
                                    <input type="text" class="form-control" v-model="master_settings.column_settings[index].options.format" v-if="['date', 'datetime'].indexOf(column.type) > -1" />
                                </th>
                            </tr>
                        </thead>
                    </table>
                </div>
                <tag-field v-if="null !== master_settings" v-model="master_settings.tags" label="Add tags to categorize the files" />
                <div  v-if="null !== master_settings">
                    <h6>Advanced Settings</h6>
                    <div class="row">
                        <div class="col-sm-3 form-group">
                            <small class="text-muted">Column Delimiter</small>
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" v-model="master_settings.column_delimiter" />
                            </div>
                        </div>
                    </div>
                </div>
                <div v-for="(info, id, index) in files" :key="index" class="card mb-3">
                    <div class="card-header header-elements-inline bg-dark text-white">
                        <h6 class="card-title">Preview of {{info.name}}</h6>
                        <div class="header-elements">
                            <div class="list-icons ml-3">
                                <div class="list-icons-item dropdown">
                                    <a :href="window.location.href" class="list-icons-item dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="icon-menu7"></i></a>
                                    <div class="dropdown-menu" x-placement="bottom-start" style="position: absolute; transform: translate3d(-111px, 16px, 0px); top: 0px; left: 0px; will-change: transform;">
                                        <a :href="window.location.href" class="dropdown-item" @click="removeFile(id)"><i class="icon-trash"></i> Remove File</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <specific-file-mapper-and-preview
                        v-model="info.setting"
                        :file="id"
                        :mapping="mapping"
                        @updated="handleFileUpdated(id)"
                        :lastPreviewTime="lastPreviewTime"
                        class="card-body"
                    />
                </div>
            </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" :id="`modal-${this._uid}`">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-dark">
                        <h5 class="modal-title">Start Import Jobs</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body table-responsive">
                        <table class="table table-bordered table-stripped table-hover table-xs text-nowrap">
                            <!-- <thead>
                                <tr>
                                    <th style="padding:0; width: 36px;" class="text-center">
                                        <button role="button" type="button" class="btn btn-sm btn-icon btn-outline-dark" @click="checkAllImportable()"><i class="icon-stack-check"></i></button>
                                    </th>
                                    <th colspan="2">&nbsp;</th>
                                </tr>
                            </thead> -->
                            <tbody>
                                <tr v-for="(checked, id, index) in importable" :key="index">
                                    <td style="padding:0; width: 36px;" class="text-center">
                                        <input type="checkbox" v-model="importable[id]" />
                                    </td>
                                    <td style="padding:0; width: 36px;" class="text-center">
                                        <button role="button" type="button" class="btn btn-sm btn-icon btn-outline-success" @click="startImportForFile(id)"><i class="icon-play4"></i></button>
                                    </td>
                                    <td>{{files[id].name}}</td>
                                </tr>
                            </tbody>
                            <!-- <tfoot>
                                <tr>
                                    <th style="padding:0; width: 36px;" class="text-center">
                                        <button role="button" type="button" class="btn btn-sm btn-icon btn-outline-dark" @click="checkAllImportable()"><i class="icon-stack-check"></i></button>
                                    </th>
                                    <th colspan="2">&nbsp;</th>
                                </tr>
                            </tfoot> -->
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="mt-1 btn btn-success" @click="importAllImportableJobs()">Enqueue All Selected</button>
                        <button type="button" class="mt-1 btn btn-dark" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {FormWizard, TabContent} from 'vue-form-wizard'
    import 'vue-form-wizard/dist/vue-form-wizard.min.css'
    export default {
        components: {
            FormWizard,
            TabContent
        },
        data () {
            return {
                loading: true,
                error: null,
                importJobs: null,
                copyFromImportJob: null,
                mapping: {},
                files: {},
                master_settings: null,
                jsoncopy: null,
                needsFormat: false,
                window,
                lastPreviewTime: null,
                importable: {},
            }
        },
        async mounted() {
            this.loadMapping();
            this.loadListsWithSettings();
            if ('object' !== typeof(this.$route.query) || !Array.isArray(this.$route.query.files)) {
                this.loading = false;
                this.error = 'Files Incorrectly Specified';
            } else {
                for (let i = 0; i < this.$route.query.files.length; i++) {
                    const file_id = this.$route.query.files[i];
                    const file_info = await this.fetchData(file_id);
                    if (false !== file_info) {
                        // if (null !== file_info.setting) {
                        //     PNotify.danger({
                        //         title: 'Error',
                        //         text: `File ${file_info.name} (#${file_id}) already has settings configured and cannot be setup in bulk`,
                        //         type: 'danger'
                        //     });
                        // } else {
                            file_info.setting = {
                                filetype: 'csv',
                                column_delimiter: ',',
                                column_quotation: '"',
                                header_row: 1,
                                column_settings: {},
                                tags: '',
                            }
                            this.files[file_id] = file_info;
                        // }
                    }
                }
                this.$forceUpdate();
            }
            jQuery(`#modal-${this._uid}`).modal({
                show: false,
            })
        },
        watch: {
            '$route': 'fetchData',
            master_settings: {
                immediate: true,
                deep: true,
                handler(val, oldVal) {
                    if(null === val) {
                        return;
                    }
                    if (JSON.stringify(val) === this.jsoncopy) {
                        return;
                    }
                    this.jsoncopy = JSON.stringify(val);
                    this.needsFormat = false;
                    for (let key in val.column_settings) {
                        const column = val.column_settings[key];
                        if (['date', 'datetime'].indexOf(column.type) > -1) {
                            val.column_settings[key].options.format = '';
                            this.needsFormat = true;
                        }
                    }
                    for (let file_id in this.files) {
                        this.files[file_id].setting = val;
                    }
                },
            },
        },
        beforeDestroy() {
            jQuery(`#modal-${this._uid}`).modal('dispose');
        },
        methods: {
            addNewColumn() {
                const currrentColumns = Object.values(this.master_settings.column_settings);
                const newKey = currrentColumns.length;
                this.master_settings.column_settings[newKey] = {
                    name: '',
                    options: {
                        default: '',
                    },
                    type: 'general',
                    virtual: true,
                }
                this.loadPreview();
            },
            async importAllImportableJobs() {
                const promises = [];
                for (let key in this.importable) {
                    if (true === this.importable[key]) {
                        promises.push(this.startImportForFile(key));
                    }
                }
                jQuery(`#modal-${this._uid}`).modal('hide');
                await Promise.all(promises);
                swal({
                    title: 'Enqueued Import Jobs',
                    text: `Enqueued ${promises.length} imports successfully`,
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-success',
                    cancelButtonClass: 'btn btn-primary',
                    showCancelButton: true,
                    confirmButtonText: 'Go to Processing List',
                    cancelButtonText: 'Go to Dashboard'
                }).then( async (result) => {
                    if (result.value) {
                        this.$router.push(`/lists/processing`);
                    } else {
                        this.$router.push(`/`);
                    }
                })
            },
            checkAllImportable() {
                jQuery(`#modal-${this._uid}`).find('input[checkbox]').prop('checked', true);
            },
            removeFile(id) {
                delete this.files[id];
                this.$nextTick( () => {
                    this.$forceUpdate();
                    this.loadPreview();
                });
            },
            loadPreview() {
                this.lastPreviewTime = (null === this.lastPreviewTime) ? 0 : this.lastPreviewTime + 1;
            },
            setFieldName(index, name) {
                this.master_settings.column_settings[index].name = name;
            },
            setFieldOption(index, property, value) {
                this.master_settings.column_settings[index].options[property] = value;
            },
            handleFileUpdated(file_id) {
                if (this.master_settings === null) {
                    const file_ids = Object.keys(this.files);
                    if (file_id === file_ids[0]) {
                        this.master_settings = JSON.parse(JSON.stringify(this.files[file_id].setting));
                        this.loading = false;
                    }
                } else {
                    this.loading = false;
                }
            },
            async fetchData (file_id) {
                const path = `/lists/${file_id}`;
                try {
                    const response = await axios.get(path);
                    return response.data.body;
                } catch (error) {
                    handleAxiosError(error);
                    return false;
                }
            },
            async startImportForFile(file_id) {
                try {
                    const response = await axios.post(`/lists/${file_id}/start`, {});
                    if (response.status >= 200 && response.status < 300) {
                        PNotify.success({
                            title: 'Success',
                            text: `Successfully Enqueued ${this.files[file_id].name} to start importing.`,
                            type: 'success'
                        });
                    } else {
                        PNotify.danger({
                            title: 'Error',
                            text: 'Failed to start Job',
                            type: 'danger'
                        });
                    }
                } catch (error) {
                    PNotify.danger({
                        title: 'Error',
                        text: error.toString(),
                        type: 'danger'
                    });
                }
            },
            async submitForm() {
                await swal({
                    title: 'Confirmation',
                    text: `Are you sure that you want to save import settings for these ${Object.keys(this.files).length} files?`,
                    type: 'question',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: 'Yes'
                }).then(async (result) => {
                    if (result.value) {
                        this.importable = {};
                        swal({
                            title: 'Processing',
                            text: 'Please wait until the changes are saved',
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
                        /**
                         * At this point, we are going to open up a modal with a list of the files and their "save" status.
                         * If the save status was successful, we will show a button which allows the user to start the import
                         * List will have checkboxes so once all the statuses are saved, the user can start the imports for all of them at once
                         */
                        const res = await new Promise( async (resolve, reject) => {
                            const submissions = [];
                            for (let file_id in this.files) {
                                const file = this.files[file_id];
                                const path = `/lists/${file_id}/settings`;
                                submissions.push(new Promise( async (resolve, reject) => {
                                    try {
                                        await axios.post(path, this.master_settings);
                                        resolve({id: file_id, status: true});
                                    } catch (error) {
                                        handleAxiosError(error);
                                        resolve({id: file_id, status: false});
                                    }
                                }));
                            }
                            const results = await Promise.all(submissions);
                            resolve(results);
                        });
                        swal.close();
                        for (let i = 0; i < res.length; i++) {
                            const result = res[i];
                            if (true === result.status) {
                                this.importable[result.id] = result.status;
                            }
                        }
                        if (Object.keys(this.importable).length === 0) {
                            swal({
                                title: 'Error',
                                text: 'None of the files submitted are importable. Please check your settings and try again.',
                                type: 'error',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-primary',
                                cancelButtonClass: 'btn btn-light',
                                showCancelButton: false,
                                showConfirmButton: true,
                            });
                        } else {
                            console.log(this.importable);
                            this.$forceUpdate();
                            jQuery(`#modal-${this._uid}`).modal('show');
                        }
                    }
                })
            },
            async loadListsWithSettings() {
                this.importJobs = null;
                this.copyFromImportJob = null;
                axios.get('/lists/with-settings').then( (response) => {
                    this.importJobs = response.data.body;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            async copySettingsFromExistingJob() {
                const settingsToCopy = this.importJobs[this.copyFromImportJob].setting;
                this.master_settings.filetype = settingsToCopy.filetype;
                this.master_settings.column_delimiter = settingsToCopy.column_delimiter;
                this.master_settings.column_quotation = settingsToCopy.column_quotation;
                this.master_settings.header_row = settingsToCopy.header_row;
                this.master_settings.column_settings = settingsToCopy.column_settings;
                this.master_settings.tags = settingsToCopy.tags;
                PNotify.success({
                    title: 'Settings copied successfully',
                    text: 'You can continue the wizard',
                    type: 'success'
                });
            },
            async loadMapping() {
                axios.get('/system/field-mapping').then( (response) => {
                    this.mapping = [];
                    const pushName = (name) => {
                        if (['fname', 'lname', 'email', 'phone', 'country', 'created_at', 'updated_at', 'files', 'tags'].indexOf(name) === -1) {
                            this.mapping.push(name);
                        }
                    }
                    for(let name in response.data.body) {
                        if (!name.includes('.') && this.mapping.indexOf(name) === -1) {
                            pushName(name);
                        }
                        if (name.includes('.')) {
                            const parts = name.split('.');
                            if (this.mapping.indexOf(parts[0]) === -1) {
                                pushName(parts[0]);
                            }
                        }
                    }
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
        }
    }
</script>