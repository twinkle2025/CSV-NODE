<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Export to API Wizard</h5>
        </div>
        <div class="card-body">
            <form action="javascript:false;">
                <form-wizard
                    title=""
                    subtitle=""
                    color="#2196F3"
                    errorColor="#F44336"
                    finishButtonText="Start Export"
                    @on-complete="submitForm()"
                >   
                    <tab-content title="Filters" :before-change="hasPreview">
                        <p class="text-muted">Use the following filters to filter the leads to be exported.</p>
                        <div class="input-group mb-3" v-if="!usesAdvancedQuery">
                            <input type="search" class="form-control" placeholder="Basic Filter" v-model="search" />
                            <div class="input-group-append">
                                <button @click="getSearchResults()" class="btn btn-outline-success" type="button"><i class="icon-search4"></i></button>
                                <button @click="openLuceneSyntaxTab()" class="btn btn-outline-secondary" type="button" title="Query Syntax"><i class="icon-help"></i></button>
                                <button @click="toggleAdvancedSearch()" class="btn btn-outline-warning" type="button" title="Use Advanced Search"><i class="fas fa-bolt"></i></button>
                            </div>
                        </div>
                        <div v-if="usesAdvancedQuery">
                            <p class="text-muted">Insert the JSON which should be applied to the <code>query</code> property of the search query object.</p>
                            <editor v-model="searchQuery" @init="editorInit" lang="json" theme="chrome" width="100%" height="400px" class="mb-3"></editor>
                            <button @click="toggleAdvancedSearch()" class="btn btn-dark" type="button">Use Basic Search</button>
                            <button @click="openQuerySyntaxTab()" class="btn btn-secondary" type="button"><i class="icon-help"></i> Query Syntax</button>
                            <button @click="getSearchResults()" class="btn btn-success" type="button"><i class="icon-search4"></i> Search</button>
                        </div>
                        <h6 class="mt-3">Preview of Results</h6>
                        <div class="alert alert-info" v-if="!loadedLeads">
                            You must run a search to preview the results.
                        </div>
                        <div class="alert alert-info" v-else-if="loadingLeads">
                            Loading preview
                        </div>
                        <div class="alert alert-warning" v-else-if="leads.length === 0 || totalLeads === 0">
                            No Results
                        </div>
                        <small v-else class="text-muted text-uppercase">{{totalLeads}} total results</small>
                        <div class="table-responsive" v-if="leads.length > 0">
                            <table class="table table-hover table-sm table-bordered">
                                <tbody>
                                    <tr v-for="(lead, index) in leads" :key="index">
                                        <td><source-preview :source="lead['_source']" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </tab-content>
                    <tab-content title="Field Mapping" :before-change="hasColumns">
                        <div class="form-group">
                            <label class="font-weight-semibold">Copy settings from previous export</label>
                            <div class="input-group mb-3">
                                <searchable-select class="custom-select" v-model="copyFromExport" @change="$forceUpdate()">
                                    <option v-for="(job, index) in previousExports" :key="index" :value="index">{{job.export_name}}</option>
                                </searchable-select>
                                <div class="input-group-append">
                                    <button @click="loadPreviousExports()" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="icon-database-refresh"></i></button>
                                    <button @click="copySettingsFromPreviousExport()" v-if="copyFromExport !== null" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-copy3"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="font-weight-semibold">Choose an API</label>
                            <div class="input-group mb-3">
                                <searchable-select class="custom-select" v-model="api">
                                    <option v-for="(job, index) in apis" :key="index" :value="index">{{job.name}}</option>
                                </searchable-select>
                                <div class="input-group-append">
                                    <button @click="loadAPIs()" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="icon-database-refresh"></i></button>
                                </div>
                            </div>
                        </div>
                        <div v-if="!api || !apis[api] || !providers[apis[api].service]" class="alert alert-warning">You must choose a valid API to continue.</div>
                        <div v-if="api && apis[api] && providers[apis[api].service] && providers[apis[api].service].notices">
                            <div v-for="(notice, index) in providers[apis[api].service].notices" :key="index" :class="`alert alert-${notice.type}`">{{notice.message}}</div>
                        </div>
                        <div v-if="api && apis[api] && providers[apis[api].service]" class="table-responsive text-nowrap mb-3" style="overflow-y:visible">
                            <table class="table table-hover table-sm table-bordered mb-0">
                                <thead>
                                    <tr>
                                        <th>API Field</th>
                                        <th>Lead Field</th>
                                        <th>Data Type</th>
                                        <th>Output Format</th>
                                        <th>Default Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(required, fieldname, index) in providers[apis[api].service].fields" :key="index">
                                        <td><code>{{fieldname}}</code></td>
                                        <td>
                                            <searchable-select class="form-control" v-model="columns[fieldname].leadField" @change="$forceUpdate()">
                                                <option value="" v-if="!required">None</option>
                                                <option v-for="(type, key, lfi) in mapping" :key="lfi" :value="key">{{key}} ({{type}})</option>
                                            </searchable-select>
                                        </td>
                                        <td>
                                            <searchable-select class="form-control" v-model="columns[fieldname].leadFieldType" @change="$forceUpdate()">
                                                <option v-if="['keyword', 'text', 'ip'].indexOf(mapping[columns[fieldname].leadField]) > -1 || '' === columns[fieldname].leadField" value="general">General</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="email">Email Address</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="phone">Phone Number</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="country">Country</option>
                                                <option v-if="['date'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="date">Date</option>
                                                <option v-if="['date'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="time">Time</option>
                                                <option v-if="['date'].indexOf(mapping[columns[fieldname].leadField]) > -1" value="datetime">Date/Time</option>
                                            </searchable-select>
                                        </td>
                                        <td>
                                            <div class="input-group" v-if="['phone', 'country', 'date', 'time', 'datetime'].indexOf(columns[fieldname].leadFieldType) > -1">
                                                <searchable-select class="form-control" v-model="columns[fieldname].leadFieldFormat" v-if="['phone', 'country'].indexOf(columns[fieldname].leadFieldType) > -1" @change="$forceUpdate()">
                                                    <option v-if="['phone'].indexOf(columns[fieldname].leadFieldType) > -1" value="raw">Unformatted</option>
                                                    <option v-if="['phone'].indexOf(columns[fieldname].leadFieldType) > -1" value="E164">E164</option>
                                                    <option v-if="['phone'].indexOf(columns[fieldname].leadFieldType) > -1" value="INTERNATIONAL">INTERNATIONAL</option>
                                                    <option v-if="['phone'].indexOf(columns[fieldname].leadFieldType) > -1" value="NATIONAL">NATIONAL</option>
                                                    <option v-if="['phone'].indexOf(columns[fieldname].leadFieldType) > -1" value="RFC3966">RFC3966</option>
                                                    <option v-if="['country'].indexOf(columns[fieldname].leadFieldType) > -1" value="raw">ISO</option>
                                                    <option v-if="['country'].indexOf(columns[fieldname].leadFieldType) > -1" value="name">Name</option>
                                                </searchable-select>
                                                <input type="text" class="form-control" v-model="columns[fieldname].leadFieldFormat" v-else @change="$forceUpdate()" />
                                                <div class="input-group-append" v-if="['date', 'time', 'datetime'].indexOf(columns[fieldname].leadFieldType) > -1">
                                                    <button class="btn btn-info" type="button" @click="openUrlInNewTab('https://momentjs.com/docs/#/displaying/format/')"><i class="icon-help"></i></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control" v-model="columns[fieldname].default" @change="$forceUpdate()" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="card" v-if="Object.keys(columns).length > 0">
                            <div class="card-header header-elements-inline">
                                <h5 class="card-title">Preview Export</h5>
                                <div class="header-elements">
                                    <div class="list-icons">
                                        <a class="list-icons-item" data-action="reload" @click="loadPreview()"></a>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive text-nowrap">
                                <table class="table table-hover table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th v-for="(info, column, index) in columns" :key="index" class="text-center">{{column}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="preview.length === 0">
                                            <td :colspan="Object.keys(columns).length" class="text-center">
                                                Please reload preview
                                            </td>
                                        </tr>
                                        <tr v-for="(row, index) in preview" :key="index">
                                            <td v-for="(column, order, i) in columns" :key="i">{{ row[order] }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </tab-content>
                    <tab-content title="Export Options">
                        <div class="form-group" v-if="fileFormat">
                            <small class="text-muted">Export Name</small>
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" v-model="fileName">
                            </div>
                        </div>
                    </tab-content>
                </form-wizard>
            </form>
        </div>
    </div>
</template>

<script>
    import {FormWizard, TabContent} from 'vue-form-wizard'
    import 'vue-form-wizard/dist/vue-form-wizard.min.css'
    export default {
        components: {
            FormWizard,
            TabContent,
            editor: require('vue2-ace-editor'),
        },
        data () {
            return {
                copyFromExport: null,
                previousExports: [],
                usesAdvancedQuery: false,
                search: '',
                searchQuery: '',
                leads: [],
                totalLeads: 0,
                loadedLeads: false,
                loadingLeads: false,
                columns: {},
                mapping: {},
                loadedMapping: false,
                preview: [],
                fileFormat: 'api',
                fileName: null,
                apis: [],
                fileFormats: {
                    csv: {
                        extension: '.csv',
                        description: 'Comma Separated Values',
                    },
                    xlsx: {
                        extension: '.xlsx',
                        description: 'Excel 2007+ XML Format',
                    },
                    xlsm: {
                        extension: '.xlsm',
                        description: 'Excel 2007+ Macro XML Format',
                    },
                    xlsb: {
                        extension: '.xlsb',
                        description: 'Excel 2007+ Binary Format',
                    },
                    biff8: {
                        extension: '.xls',
                        description: 'Excel 97-2004 Workbook Format',
                    },
                    biff5: {
                        extension: '.xls',
                        description: 'Excel 5.0/95 Workbook Format',
                    },
                    biff2: {
                        extension: '.xls',
                        description: 'Excel 2.0 Worksheet Format',
                    },
                    xlml: {
                        extension: '.xls',
                        description: 'Excel 2003-2004 (SpreadsheetML)',
                    },
                    ods: {
                        extension: '.ods',
                        description: 'OpenDocument Spreadsheet',
                    },
                    fods: {
                        extension: '.fods',
                        description: 'Flat OpenDocument Spreadsheet',
                    },
                    txt: {
                        extension: '.txt',
                        description: 'UTF-16 Unicode Text (TXT)',
                    },
                    sylk: {
                        extension: '.sylk',
                        description: 'Symbolic Link (SYLK)',
                    },
                    html: {
                        extension: '.html',
                        description: 'HTML Document',
                    },
                    dif: {
                        extension: '.dif',
                        description: 'Data Interchange Format (DIF)',
                    },
                    dbf: {
                        extension: '.dbf',
                        description: 'dBASE II + VFP Extensions (DBF)',
                    },
                    rtf: {
                        extension: '.rtf',
                        description: 'Rich Text Format (RTF)',
                    },
                    prn: {
                        extension: '.prn',
                        description: 'Lotus Formatted Text',
                    },
                    eth: {
                        extension: '.eth',
                        description: 'Ethercalc Record Format (ETH)',
                    },
                },
                providers: {},
                api: null,
            }
        },
        created () {},
        mounted() {
            this.loadAPIs();
            this.loadMapping();
            this.loadApiProviders();
            this.loadPreviousExports();
        },
        watch: {
            api(newVal, oldVal) {
                this.columns = {};
                if (newVal && this.apis[newVal] && this.providers[this.apis[newVal].service]) {
                    const fields = this.providers[this.apis[newVal].service].fields;
                    for (let field in fields) {
                        this.columns[field] = {
                            leadField: (false === fields[field]) ? '' : null,
                            leadFieldType: (false === fields[field]) ? 'general' : null,
                            leadFieldFormat: null,
                            default: null,
                        }
                    }
                }
            },
        },
        methods: {
            async loadPreviousExports() {
                this.previousExports = [];
                this.copyFromExport = null;
                axios.get('/leads/exports/api').then( (response) => {
                    this.previousExports = response.data.body;
                    this.$forceUpdate();
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            copySettingsFromPreviousExport() {
                const settingsToCopy = this.previousExports[this.copyFromExport];
                for (let i = 0; i < this.apis.length; i++) {
                    const api = this.apis[i];
                    if (settingsToCopy.drive_name == api.id) {
                        this.api = `${i}`;
                    }
                }
                this.$nextTick( () => {
                    this.columns = settingsToCopy.export_columns;
                })
            },
            async loadAPIs() {
                this.apis = [];
                this.copyFromExport = null;
                axios.get('/export-apis/all').then( (response) => {
                    this.apis = response.data.body;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            openLuceneSyntaxTab() {
                const url = 'https://www.elastic.co/guide/en/kibana/7.0/lucene-query.html';
                window.open(url, '_blank');
            },
            openQuerySyntaxTab() {
                const url = 'https://www.elastic.co/guide/en/elasticsearch/reference/7.x/query-dsl.html';
                window.open(url, '_blank');
            },
            openUrlInNewTab(url) {
                window.open(url, '_blank');
            },
            toggleAdvancedSearch() {
                this.usesAdvancedQuery = !this.usesAdvancedQuery;
            },
            getFieldTypeName(type) {
                const names = {
                    general: 'General',
                    email: 'Email Address',
                    phone: 'Phone Number',
                    country: 'Country',
                    date: 'Date',
                    time: 'Time',
                    datetime: 'Date/Time',
                };
                return ('undefined' === typeof(names[type])) ? 'Unknown' : names[type];
            },
            getFieldTypeFormat(type, format) {
                if (['date', 'time', 'datetime'].indexOf(type) > -1) {
                    return format;
                }
                else if (['country', 'phone'].indexOf(type) > -1) {
                    return format.toUpperCase();
                }
                else {
                    return null;
                }
            },
            async submitForm() {
                console.log({
                    columns: this.columns,
                    fileFormat: this.fileFormat,
                    fileName: this.fileName,
                    filter: (this.usesAdvancedQuery) ? this.searchQuery : this.search,
                    isAdvancedFilter: this.usesAdvancedQuery,
                    api: this.apis[this.api].id,
                });
                const path = `/leads/export`;
                await swal({
                    title: 'Confirmation',
                    text: 'Are you ready to start the export?',
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
                            text: 'Your export job is being created',
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
                        axios.post(path, {
                            columns: this.columns,
                            fileFormat: this.fileFormat,
                            fileName: this.fileName,
                            filter: (this.usesAdvancedQuery) ? this.searchQuery : this.search,
                            isAdvancedFilter: this.usesAdvancedQuery,
                            api: this.apis[this.api].id,
                        }).then( (response) => {
                            swal({
                                title: 'Success',
                                text: 'Your export job has been created successfully',
                                type: 'success',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-success',
                                cancelButtonClass: 'btn btn-primary',
                                showCancelButton: false,
                                confirmButtonText: 'Great',
                                allowOutsideClick: false,
                                allowEscapeKey: false,
                                allowEnterKey: false,
                            }).then( (result) => {
                                if (result.value) {
                                    this.$router.push('/leads/exports');
                                }
                            })
                        })
                        .catch( (error) => {
                            swal.close();
                            handleAxiosError(error);
                        });      
                    }
                })
            },
            async getSearchResults() {
                this.leads = [];
                this.totalLeads = 0;
                this.loadingLeads = true;
                let query;
                try {
                    query = (this.usesAdvancedQuery) ? JSON.parse(this.searchQuery) : this.search;
                } catch (error) {
                    this.loadingLeads = false;
                    PNotify.danger({
                        title: 'Error',
                        text: error.toString(),
                        type: 'danger'
                    });
                    return;
                }
                axios.post('/leads', {
                    advanced: this.usesAdvancedQuery,
                    query,
                }).then( (response) => {
                    const data = response.data.body;
                    this.leads = data.hits.hits;
                    this.totalLeads = data.hits.total.value;
                    this.loadingLeads = false;
                    this.loadedLeads = true;
                })
                .catch( (error) => {
                    this.loadingLeads = false;
                    handleAxiosError(error);
                });
            },
            async loadMapping() {
                this.mapping = {};
                axios.get('/system/field-mapping').then( (response) => {
                    this.mapping = response.data.body;
                    this.loadedMapping = true;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            async loadPreview() {
                this.preview = [];
                axios.post('/leads/preview-export', {
                    columns: this.columns,
                    leads: this.leads,
                    type: 'api',
                }).then( (response) => {
                    this.preview = response.data.body;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            editorInit: function () {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/json')                
                require('brace/theme/chrome')
            },
            async hasPreview() {
                if (this.totalLeads === 0) {
                    await swal({
                        title: 'Error',
                        text: 'Your filter doesn\'t return any leads.' + "\n" + 'Please check your filter and preview the results.',
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                    });
                    return false;
                }
                //if (this.totalLeads >= 1500000) {
                //    await swal({
                //        title: 'Error',
                //        text: 'Your filter returned too many leads.' + "\n" + 'Please change your filter to include less than 1.5 Million Leads.',
                //        type: 'error',
                //        showCancelButton: false,
                //        confirmButtonText: 'OK',
                //    });
                //    return false;
                //}
                return true;
            },
            async hasColumns() {
                if (!this.api || !this.apis[this.api] || !this.providers[this.apis[this.api].service]) {
                    await swal({
                        title: 'Error',
                        text: 'You haven\'t chosen a valid API to export to.',
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                    });
                    return false;
                }
                if(this.totalLeads > this.providers[this.apis[this.api].service].max) {
                    await swal({
                        title: 'Too Many Results',
                        text: `You can only create export jobs with up to ${this.providers[this.apis[this.api].service].max} leads for ${this.apis[this.api].name}. Please check your search filters and try again.`,
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                    });
                    return false;
                }
                for (let field in this.providers[this.apis[this.api].service].fields) {
                    const required = this.providers[this.apis[this.api].service].fields[field];
                    if (required) {
                        if (!this.columns[field].leadField && !this.columns[field].default) {
                            await swal({
                                title: 'Unmapped Field',
                                text: `You must provide EITHER a lead field or a default value for the "${field}" field. For best results, provide both.`,
                                type: 'error',
                                showCancelButton: false,
                                confirmButtonText: 'OK',
                            });
                            return false;
                        }
                    }
                    if (!this.columns[field].leadFieldType) {
                        await swal({
                            title: 'Undefined Data Type',
                            text: `You must define the data type for the "${field}" field.`,
                            type: 'error',
                            showCancelButton: false,
                            confirmButtonText: 'OK',
                        });
                        return false;
                    }
                    if (['phone', 'country', 'date', 'time', 'datetime'].indexOf(this.columns[field].leadFieldType) > -1 && !this.columns[field].leadFieldFormat) {
                        await swal({
                            title: 'Undefined Output Format',
                            text: `You must define the output format for the "${field}" field.`,
                            type: 'error',
                            showCancelButton: false,
                            confirmButtonText: 'OK',
                        });
                        return false;
                    }
                }
                return true;
            },
            async hasNameAndFormat() {
                if (!this.fileFormat || !this.fileName) {
                    await swal({
                        title: 'Error',
                        text: 'You must name your file and choose the file format',
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                    });
                    return false;
                }
                return true;
            },
            async loadApiProviders() {
                const path = `/export-apis/providers`;
                try {
                    const response = await axios.get(path);
                    this.providers = response.data.body;
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load api information';
                }
            },
        }
    }
</script>