<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">{{title}}</h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading && !error">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="!loading" class="form-group">
                <label>Template Name</label>
                <input type="text" v-model="name" class="form-control form-control-lg" />
            </div>
            <div v-if="!loading" class="row">
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
                                <select class="form-control form-control-sm" v-model="columnToAdd.leadField">
                                    <option v-for="(type, key, index) in mapping" :key="index" :value="key">{{key}} ({{type}})</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <small class="text-muted mb-1">Column Name</small>
                                <input type="text" class="form-control form-control-sm" v-model="columnToAdd.columnName" />
                            </div>
                            <div class="form-group" v-if="['keyword', 'text', 'date', 'ip'].indexOf(mapping[columnToAdd.leadField]) > -1">
                                <small class="text-muted mb-1">Column Data Type</small>
                                <select class="form-control form-control-sm" v-model="columnToAdd.leadFieldType">
                                    <option v-if="['keyword', 'text', 'ip'].indexOf(mapping[columnToAdd.leadField]) > -1" value="general">General</option>
                                    <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="email">Email Address</option>
                                    <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="phone">Phone Number</option>
                                    <option v-if="['keyword', 'text'].indexOf(mapping[columnToAdd.leadField]) > -1" value="country">Country</option>
                                    <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="date">Date</option>
                                    <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="time">Time</option>
                                    <option v-if="['date'].indexOf(mapping[columnToAdd.leadField]) > -1" value="datetime">Date/Time</option>
                                </select>
                            </div>
                            <div class="form-group" v-if="['phone', 'country', 'date', 'time', 'datetime'].indexOf(columnToAdd.leadFieldType) > -1">
                                <small class="text-muted mb-1">Data Format</small>
                                <div class="input-group">
                                    <select class="form-control" v-model="columnToAdd.format" v-if="['phone', 'country'].indexOf(columnToAdd.leadFieldType) > -1">
                                        <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="raw">Unformatted</option>
                                        <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="E164">E164</option>
                                        <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="INTERNATIONAL">INTERNATIONAL</option>
                                        <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="NATIONAL">NATIONAL</option>
                                        <option v-if="['phone'].indexOf(columnToAdd.leadFieldType) > -1" value="RFC3966">RFC3966</option>
                                        <option v-if="['country'].indexOf(columnToAdd.leadFieldType) > -1" value="raw">ISO</option>
                                        <option v-if="['country'].indexOf(columnToAdd.leadFieldType) > -1" value="name">Name</option>
                                    </select>
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
            <div v-if="!loading" class="text-right">
                <button role="button" class="btn btn-primary mb-3" type="button" @click="submitForm()">Save</button>
            </div>
            <div class="card" v-if="Object.keys(columns).length > 0">
                <div class="card-header header-elements-inline">
                    <h5 class="card-title">Preview Template</h5>
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
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                title: 'Export Template',
                name: null,
                loading: true,
                error: null,
                mapping: {},
                leads: [],
                totalLeads: 0,
                usesAdvancedQuery: false,
                search: '',
                searchQuery: '',
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
            }
        },
        async mounted() {
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create an Export Template' : `Edit Export Template #${this.$route.params.id}`;
            await this.getSearchResults();
            await this.loadMapping();
            if ('undefined' !== typeof(this.$route.params.id)) {
                await this.loadTemplateInformation();
            } else {
                this.$nextTick(() => {
                    this.loading = false;
                });
            }
            
        },
        methods: {
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the Export Template. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? '/export-templates/' : `/export-templates/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            columns: this.columns,
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved Export Template Successfully.',
                        type: 'success',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-success',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: true,
                        allowOutsideClick: true,
                        allowEscapeKey: true,
                        allowEnterKey: true,
                    });
                    if ('undefined' === typeof(this.$route.params.id)) {
                        this.$router.push(`/export/templates/${response.data.body.id}`);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadTemplateInformation() {
                this.loading = true;
                const path = `/export-templates/${this.$route.params.id}`;
                try {
                    const response = await axios.get(path);
                    this.name = response.data.body.name;
                    this.columns = response.data.body.export_columns;
                    this.loading = false;
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load template information';
                }
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
        }
    }
</script>