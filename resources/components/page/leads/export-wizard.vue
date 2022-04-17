<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Export to File Wizard</h5>
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
                        <p class="text-muted">Export Limit. Use <code>-1</code> for all results.</p>
                        <div class="input-group mb-3">
                            <input type="number" class="form-control" placeholder="Export Limit" min="-1" :max="totalLeads" v-model="limit" />
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
                    <tab-content title="Column Options" :before-change="hasColumns">
                        <div class="form-group">
                            <label class="font-weight-semibold">Copy settings from Export Template</label>
                            <div class="input-group mb-3">
                                <searchable-select class="custom-select" v-model="copyFromTemplate">
                                    <option v-for="(job, index) in exportTemplates" :key="index" :value="index">{{job.name}}</option>
                                </searchable-select>
                                <div class="input-group-append">
                                    <button @click="loadExportTemplates()" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="icon-database-refresh"></i></button>
                                    <button @click="copySettingsFromTemplate()" v-if="copyFromTemplate !== null" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-copy3"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-sm-4 col-xl-3">
                                <div class="card bg-secondary text-white">
                                    <div class="card-header header-elements-inline">
                                        <h6 class="card-title">Add a column</h6>
                                        <div class="header-elements">
                                            <div class="list-icons">
                                                <a class="list-icons-item" data-action="reload" @click="loadMapping()"></a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-body" v-if="Object.keys(mapping).length === 0">
                                        <div class="alert alert-info p-1">
                                            Please <a @click="loadMapping()">click here</a> to load fields.
                                        </div>
                                    </div>
                                    <div class="card-body" v-else>
                                        <div class="form-group">
                                            <small class="text-muted mb-1">Lead Field</small>
                                            <searchable-select class="form-control form-control-sm" v-model="columnToAdd.leadField">
                                                <option v-for="(type, key, index) in mapping" :key="index" :value="key">{{key}} ({{type}})</option>
                                            </searchable-select>
                                        </div>
                                        <div class="form-group">
                                            <small class="text-muted mb-1">Column Name</small>
                                            <input type="text" class="form-control form-control-sm" v-model="columnToAdd.columnName" />
                                        </div>
                                        <div class="form-group" v-if="['keyword', 'text', 'date', 'ip'].indexOf(mapping[columnToAdd.leadField]) > -1">
                                            <small class="text-muted mb-1">Column Data Type</small>
                                            <searchable-select class="form-control form-control-sm" v-model="columnToAdd.leadFieldType">
                                                <option v-if="['keyword', 'text', 'ip'].indexOf(mapping[columnToAdd.leadField]) > -1" value="general">General</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="email">Email Address</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="phone">Phone Number</option>
                                                <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="country">Country</option>
                                                <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="date">Date</option>
                                                <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="time">Time</option>
                                                <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="datetime">Date/Time</option>
                                            </searchable-select>
                                        </div>
                                        <div class="form-group" v-if="['phone', 'country', 'date', 'time', 'datetime'].indexOf(columnToAdd.leadFieldType) > -1">
                                            <small class="text-muted mb-1">Data Format</small>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="columnToAdd.format" v-if="['phone', 'country'].indexOf(columnToAdd.leadFieldType) > -1">
                                                    <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="raw">Unformatted</option>
                                                    <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="E164">E164</option>
                                                    <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="INTERNATIONAL">INTERNATIONAL</option>
                                                    <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="NATIONAL">NATIONAL</option>
                                                    <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="RFC3966">RFC3966</option>
                                                    <option v-if="['country'].indexOf(columnToAdd.leadFieldType) > -1" value="raw">ISO</option>
                                                    <option v-if="['country'].indexOf(columnToAdd.leadFieldType) > -1" value="name">Name</option>
                                                </searchable-select>
                                                <input type="text" class="form-control" v-model="columnToAdd.format" v-else />
                                                <div class="input-group-append" v-if="['date', 'time', 'datetime'].indexOf(columnToAdd.leadFieldType) > -1">
                                                    <button class="btn btn-info" type="button" @click="openUrlInNewTab('https://momentjs.com/docs/#/displaying/format/')"><i class="icon-help"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                        <button class="btn btn-success btn-block"
                                            v-if="columnToAdd.leadField && columnToAdd.columnName && columnToAdd.leadFieldType && (['phone', 'country', 'date', 'time', 'datetime'].indexOf(columnToAdd.leadFieldType) === -1 || columnToAdd.format)"
                                            type="button" role="button" @click="addNewColumn()">Add Column</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-8 col-xl-9">
                                <div class="card">
                                    <div class="card-header header-elements-inline">
                                        <h6 class="card-title">Configured Columns</h6>
                                        <div class="header-elements">
                                            <div class="list-icons"></div>
                                        </div>
                                    </div>
                                    <div class="card-body" v-if="Object.keys(columns).length === 0">
                                        <div class="alert alert-info p-1">
                                            There are no columns configured
                                        </div>
                                    </div>
                                    <div class="table-responsive text-nowrap" v-else>
                                        <table class="table table-hover table-sm table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>&nbsp;</th>
                                                    <th>Column Order</th>
                                                    <th>Column Name</th>
                                                    <th>Lead Field</th>
                                                    <th>Field Type</th>
                                                    <th>Format</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="(column, order, index) in columns" :key="index">
                                                    <td>
                                                        <div class="btn-group btn-group-sm" role="group">
                                                            <button type="button" class="btn btn-danger" @click="removeColumn(order)"><i class="fas fa-trash-alt"></i></button>
                                                            <button type="button" class="btn btn-dark" @click="swapColumn(order, (parseInt(order) - 1))" v-if="order > 0"><i class="fas fa-caret-up"></i></button>
                                                            <button type="button" class="btn btn-dark" @click="swapColumn(order, (parseInt(order) + 1))" v-if="order < (Object.keys(columns).length - 1)"><i class="fas fa-caret-down"></i></button>
                                                        </div>
                                                    </td>
                                                    <td><code>{{order}}</code></td>
                                                    <td><code>{{column.columnName}}</code></td>
                                                    <td><code>{{column.leadField}}</code></td>
                                                    <td><i :class="getFieldTypeIcon(column.leadFieldType)"></i>{{ getFieldTypeName(column.leadFieldType) }}</td>
                                                    <td><code>{{getFieldTypeFormat(column.leadFieldType, column.format)}}</code></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
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
                                            <th v-for="(column, order, index) in columns" :key="index" class="text-center">{{column.columnName}}</th>
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
                    <tab-content title="File Options" :before-change="hasNameAndFormat">
                        <div class="form-group">
                            <small class="text-muted">File Format</small>
                            <select class="form-control" v-model="fileFormat">
                                <option v-for="(format, value, index) in fileFormats" :key="index" :value="value">{{format.description}} ({{format.extension}})</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="fileFormat">
                            <small class="text-muted">File Name</small>
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" v-model="fileName">
                                <div class="input-group-append">
                                    <span class="input-group-text" id="basic-addon2">{{ fileFormats[fileFormat].extension }}</span>
                                </div>
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
    const numeral = require('numeral');
    export default {
        components: {
            FormWizard,
            TabContent,
            editor: require('vue2-ace-editor'),
        },
        data () {
            return {
                usesAdvancedQuery: false,
                search: '',
                searchQuery: '',
                leads: [],
                totalLeads: 0,
                limit: -1,
                loadedLeads: false,
                loadingLeads: false,
                columns: {},
                mapping: {},
                loadedMapping: false,
                columnToAdd: {
                    leadField: null,
                    columnName: null,
                    leadFieldType: null,
                    format: null,
                },
                preview: [],
                fileFormat: null,
                fileName: null,
                copyFromTemplate: null,
                exportTemplates: [],
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
                }
            }
        },
        created () {},
        mounted() {
            this.loadMapping();
        },
        watch: {},
        methods: {
            async loadExportTemplates() {
                this.exportTemplates = [];
                this.copyFromTemplate = null;
                axios.get('/export-templates/all').then( (response) => {
                    this.exportTemplates = response.data.body;
                    PNotify.info({
                        title: 'Loaded Export Templates',
                        text: 'Export Templates have been loaded. Please choose one from the dropdown list to continue.',
                        type: 'info'
                    });
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            copySettingsFromTemplate() {
                const settingsToCopy = this.exportTemplates[this.copyFromTemplate];
                this.columns = settingsToCopy.export_columns;
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
            addNewColumn() {
                const columns = Object.values(this.columns);
                columns.push(this.columnToAdd);
                this.columns = {};
                for (let i = 0; i < columns.length; i++) {
                    const column = columns[i];
                    this.columns[i] = column;
                }
                this.columnToAdd = {
                    leadField: null,
                    columnName: null,
                    leadFieldType: null,
                    format: null,
                }
                this.preview = [];
            },
            removeColumn(index) {
                delete this.columns[index];
                const columns = Object.values(this.columns);
                this.columns = {};
                for (let i = 0; i < columns.length; i++) {
                    const column = columns[i];
                    this.columns[i] = column;
                }
                this.preview = [];
            },
            swapColumn(currentIndex, newIndex) {
                const currentColumn = Object.assign(this.columns[newIndex]);
                const newColumn = Object.assign(this.columns[currentIndex]);
                const columns = Object.assign(this.columns);
                columns[newIndex] = newColumn;
                columns[currentIndex] = currentColumn;
                const nc = Object.values(columns);
                this.columns = {};
                for (let i = 0; i < nc.length; i++) {
                    const column = nc[i];
                    this.columns[i] = column;
                }
                this.preview = [];
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
            getFieldTypeIcon(type) {
                const names = {
                    general: 'fas fa-quote-left mr-2',
                    email: 'icon-envelop4 mr-2',
                    phone: 'icon-phone mr-2',
                    country: 'fas fa-globe-americas mr-2',
                    date: 'far fa-clock mr-2',
                    time: 'far fa-clock mr-2',
                    datetime: 'far fa-clock mr-2',
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
                            limit: this.limit,
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
                return true;
            },
            async hasColumns() {
                if (Object.keys(this.columns).length === 0) {
                    await swal({
                        title: 'Error',
                        text: 'You haven\'t defined any columns for your export.',
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                    });
                    return false;
                }
                return true;
            },
            async hasNameAndFormat() {
                let totalLeadsToExport = this.totalLeads;
                if (this.limit > -1 && this.totalLeads > this.limit) {
                    totalLeadsToExport = this.limit;
                }
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
                try {
                    const {data} = await axios.get(`/leads/exports/get-file-type-max?type=${this.fileFormat}`);
                    if (data.body > -1 && totalLeadsToExport > data.body) {
                        await swal({
                            title: 'Too Many Leads',
                            text: `${this.fileFormats[this.fileFormat].description} exports are limited to ${numeral(data.body).format('0,0')} rows. You are trying to export ${numeral(this.totalLeads).format('0,0')} rows. Please either change your filters or change the file format. CSV and TXT files do not have any file length restrictions.`,
                            type: 'error',
                            showCancelButton: false,
                            confirmButtonText: 'OK',
                        });
                        return false;
                    }
                } catch (error) {
                    handleAxiosError(error);
                }
                return true;
            }
        }
    }
</script>