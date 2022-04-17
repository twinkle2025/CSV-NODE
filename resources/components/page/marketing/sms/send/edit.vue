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
            <div v-if="!loading && !error" class="form-group">
                <label>SMS Blast Name</label>
                <input type="text" v-model="name" class="form-control form-control-lg" />
            </div>
            <div v-if="!loading && !error">
                <div class="form-group">
                    <label>SMS Provider Provider</label>
                    <searchable-select class="form-control form-control-lg" v-model="configuration.provider">
                        <option v-for="(info, pi, index) in smsProviders" :key="index" :value="info.id">{{info.name}} ({{info.service}})</option>
                    </searchable-select>
                </div>
                <label>
                    Message Sender
                    <small class="text-secondary">Note: This will be shortened to 11 characters</small>
                </label>
                <editor v-model="configuration.subject" @init="senderEditorInit" lang="text" theme="chrome" width="100%" height="18px" class="mb-1"></editor>
                <div class="form-group mb-3">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Add Mail-Merge Variable</span>
                        </div>
                        <searchable-select class="custom-select" v-model="senderMailMergeVal">
                            <option v-for="(type, key, index) in mapping" :key="index" :value="`{{${key}}}`">{{key}}</option>
                        </searchable-select>
                        <div class="input-group-append">
                            <button @click="addMailMergeValueToSender()" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                        </div>
                    </div>
                </div>
                <label>Message Contents</label>
                <editor v-model="configuration.body" @init="editorInit" lang="text" theme="chrome" width="100%" height="400px" class="mb-1"></editor>
                <div class="form-group mb-3">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Add Mail-Merge Variable</span>
                        </div>
                        <searchable-select class="custom-select" v-model="mailMergeVal">
                            <option v-for="(type, key, index) in mapping" :key="index" :value="`{{${key}}}`">{{key}}</option>
                        </searchable-select>
                        <div class="input-group-append">
                            <button @click="addMailMergeValueToMessage()" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                        </div>
                    </div>
                </div>
                <csv-tags-field v-model="configuration.manual_recipients" label="Manually Specify Recipient Phone Numbers" />
                <label>Recipients by Query</label>
                <div class="input-group mb-3" v-if="!configuration.recipient_query.usesAdvancedQuery">
                    <input type="search" class="form-control" placeholder="Search" v-model="configuration.recipient_query.search" />
                    <div class="input-group-append">
                        <button @click="getSearchResults()" class="btn btn-outline-success" type="button"><i class="icon-search4"></i></button>
                        <button @click="openLuceneSyntaxTab()" class="btn btn-outline-secondary" type="button" title="Query Syntax"><i class="icon-help"></i></button>
                        <button @click="toggleAdvancedSearch()" class="btn btn-outline-warning" type="button" title="Use Advanced Search"><i class="fas fa-bolt"></i></button>
                    </div>
                </div>
                <div v-if="configuration.recipient_query.usesAdvancedQuery">
                    <p class="text-muted">Insert the JSON which should be applied to the <code>query</code> property of the search query object.</p>
                    <editor v-model="configuration.recipient_query.searchQuery" @init="searchEditorInit" lang="json" theme="chrome" width="100%" height="400px" class="mb-3"></editor>
                    <button @click="toggleAdvancedSearch()" class="btn btn-dark" type="button">Use Basic Search</button>
                    <button @click="openQuerySyntaxTab()" class="btn btn-secondary" type="button"><i class="icon-help"></i> Query Syntax</button>
                    <button @click="getSearchResults()" class="btn btn-success" type="button"><i class="icon-search4"></i> Search</button>
                </div>
                <div class="card">
                    <div class="card-header header-elements-inline">
                        <h6 class="card-title">
                            Query Results
                            <small v-if="loadedLeads" class="text-muted text-uppercase">{{totalLeads}} total results</small>
                        </h6>
                        <div class="header-elements">
                            <div class="list-icons">
                                <a :href="window.location.href" class="list-icons-item" @click="toggleShowPreview()"><i :class="(!showPreview) ? 'icon-enlarge7' : 'icon-shrink7'"></i></a>
                                <a class="list-icons-item" data-action="reload" @click="getSearchResults()"></a>
                            </div>
                        </div>
                    </div>
                    <div class="table-responsive mb-0 text-nowrap" v-if="showPreview">
                        <table class="table table-hover table-sm table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th v-for="(name, index) in columns" :key="index">
                                        <code v-if="'_source' === name">{{name}}</code>
                                        <span v-else>{{name}}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="leads.length === 0">
                                    <td :colspan="columns.length" class="text-center">No Results</td>
                                </tr>
                                <tr v-for="(lead, index) in leads" :key="index">
                                    <td v-for="(name, index) in columns" :key="index">
                                        <source-preview v-if="'_source' === name" :source="lead['_source']" />
                                        <span v-else>{{getColumnDataDisplay(name, lead['_source'])}}</span>
                                    </td>
                                </tr>
                                <tr v-if="leads.length > 0 && scroll && leads.length < totalLeads">
                                    <td v-if="!scrollLoading" :colspan="columns.length" class="text-center" @click="getScrollResults()"><a class="d-block">Load more results</a></td>
                                    <td v-else :colspan="columns.length" class="text-center">Loading more results</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="form-group">
                    <label>Send At:</label>
                    <div class="input-group">
                        <span class="input-group-prepend">
                            <span class="input-group-text"><i class="icon-calendar22"></i></span>
                        </span>
                        <input type="text" class="form-control daterange-single" readonly>
                        <!-- <span class="input-group-append">
                            <span class="input-group-text">
                                <input type="checkbox" class="mr-2" v-model="configuration.send_at.local" /> Use Recipient Local Timezone
                            </span>
                        </span> -->
                    </div>
                </div>
            </div>
            <div v-if="!loading && !error" class="text-right">
                <button role="button" class="btn btn-primary mb-3" type="button" @click="submitForm()">Send Blast</button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                scrollLoading: false,
                loadedLeads: false,
                mailMergeVal: null,
                senderMailMergeVal: null,
                mapping: {},
                loadedMapping: false,
                senderEditor: null,
                messageEditor: null,
                title: 'SMS Blast',
                name: null,
                loading: true,
                error: null,
                send: {},
                provider: 'sms',
                configuration: {},
                smsProviders: {},
                leads: [],
                totalLeads: 0,
                scroll: null,
                columns: ['_source'],
                showPreview: false,
                window,
                moment: require('moment'),
            }
        },
        async mounted() {
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create an SMS Blast' : `Edit SMS Blast #${this.$route.params.id}`;
            if ('undefined' !== typeof(this.$route.params.id)) {
                await new Promise( async (resolve) => {
                    await this.loadApiProviders();
                    await this.loadApiInformation();
                    await this.loadMapping();
                    await this.loadSMSProviders();
                    this.loading = false;
                    this.loadSendAt();
                    resolve();
                })
            } else {
                await this.loadMapping();
                await this.loadApiProviders();
                await this.loadSMSProviders();
                this.$nextTick(() => {
                    this.loading = false;
                    this.loadSendAt();
                });
            }
            
        },
        methods: {
            loadSendAt() {
                this.$nextTick(() => {
                    this.configuration.send_at.time = moment().tz('UTC');
                    $('.daterange-single').daterangepicker(
                        {
                            startDate: this.configuration.send_at.time,
                            singleDatePicker: true,
                            timePicker: true,
                            applyClass: 'btn-sm bg-slate',
                            cancelClass: 'btn-sm btn-light',
                            autoApply: false,
                            locale: {
                                format: 'MMM Do, YYYY @ HH:mm',
                            },
                            opens: 'right',
                            timePicker24Hour: true,
                            minDate: moment(),
                            autoUpdateInput: true,
                        },
                        (start, end) => {
                            // console.log(start);
                            // console.log(end);
                            this.configuration.send_at.time = end.tz('UTC');
                        }
                    );
                });
            },
            toggleShowPreview() {
                this.showPreview = !this.showPreview;
            },
            openLuceneSyntaxTab() {
                const url = 'https://www.elastic.co/guide/en/kibana/7.0/lucene-query.html';
                window.open(url, '_blank');
            },
            openQuerySyntaxTab() {
                const url = 'https://www.elastic.co/guide/en/elasticsearch/reference/7.x/query-dsl.html';
                window.open(url, '_blank');
            },
            async getSearchResults() {
                this.loadedLeads = false;
                this.leads = [];
                this.totalLeads = 0;
                this.scroll = null;
                let query;
                try {
                    query = (this.configuration.recipient_query.usesAdvancedQuery) ? JSON.parse(this.configuration.recipient_query.searchQuery) : this.configuration.recipient_query.search;
                } catch (error) {
                    this.loadedLeads = true;
                    PNotify.danger({
                        title: 'Error',
                        text: error.toString(),
                        type: 'danger'
                    });
                    return;
                }
                axios.post('/leads', {
                    advanced: this.configuration.recipient_query.usesAdvancedQuery,
                    query,
                }).then( (response) => {
                    const data = response.data.body;
                    this.loadedLeads = true;
                    this.leads = data.hits.hits;
                    this.totalLeads = data.hits.total.value;
                    this.scroll = data['_scroll_id'];
                })
                .catch( (error) => {
                    this.loadedLeads = true;
                    if ('undefined' !== typeof(error.response)) {
                        if (Array.isArray(error.response.data.errors)) {
                            for (let i = 0; i < error.response.data.errors.length; i++) {
                                const err = error.response.data.errors[i];
                                switch (typeof (err)) {
                                    case 'object':
                                        PNotify.danger({
                                            title: 'Error',
                                            text: err.message,
                                            type: 'danger'
                                        });
                                        break;

                                    case 'string':
                                        PNotify.danger({
                                            title: 'Error',
                                            text: err,
                                            type: 'danger'
                                        });
                                        break;
                                }
                            }
                        } else {
                            PNotify.danger({
                                title: 'Error',
                                text: error.response.data.error.message,
                                type: 'danger'
                            });    
                        }
                    } else {
                        console.warn(error);
                        PNotify.danger({
                            title: 'Error',
                            text: 'An unrecoverable error occured. Please contact a system administrator.',
                            type: 'danger'
                        });
                    }
                });
            },
            async getScrollResults() {
                if (!this.scroll) {
                    PNotify.danger({
                        title: 'Error',
                        text: 'No more results could be loaded',
                        type: 'danger'
                    });
                    return;
                }
                axios.post('/leads/scroll', {
                    scroll: this.scroll,
                }).then( (response) => {
                    const data = response.data.body;
                    this.scroll = data['_scroll_id'];
                    for (let i = 0; i < data.hits.hits.length; i++) {
                        const lead = data.hits.hits[i];
                        this.leads.push(lead);
                    }
                })
                .catch( (error) => {
                    if ('undefined' !== typeof(error.response)) {
                        if (Array.isArray(error.response.data.errors)) {
                            for (let i = 0; i < error.response.data.errors.length; i++) {
                                const err = error.response.data.errors[i];
                                switch (typeof (err)) {
                                    case 'object':
                                        PNotify.danger({
                                            title: 'Error',
                                            text: err.message,
                                            type: 'danger'
                                        });
                                        break;

                                    case 'string':
                                        PNotify.danger({
                                            title: 'Error',
                                            text: err,
                                            type: 'danger'
                                        });
                                        break;
                                }
                            }
                        } else {
                            PNotify.danger({
                                title: 'Error',
                                text: error.response.data.error.message,
                                type: 'danger'
                            });    
                        }
                    } else {
                        console.warn(error);
                        PNotify.danger({
                            title: 'Error',
                            text: 'An unrecoverable error occured. Please contact a system administrator.',
                            type: 'danger'
                        });
                    }
                });
            },
            toggleAdvancedSearch() {
                this.configuration.recipient_query.usesAdvancedQuery = !this.configuration.recipient_query.usesAdvancedQuery;
                this.$forceUpdate();
            },
            addMailMergeValueToSender() {
                if (this.senderMailMergeVal) {
                    this.senderEditor.session.insert(this.senderEditor.getCursorPosition(), this.senderMailMergeVal);
                    this.senderMailMergeVal = null;
                }
            },
            addMailMergeValueToMessage() {
                if (this.mailMergeVal) {
                    this.messageEditor.session.insert(this.messageEditor.getCursorPosition(), this.mailMergeVal);
                    this.mailMergeVal = null;
                }
            },
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the SMS Blast. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? 'marketing/sms/blasts/' : `marketing/sms/blasts/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            service: this.provider,
                            configuration: this.configuration,
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved SMS Blast Successfully.',
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
                        //this.$router.push(`/marketing/sms/send/${response.data.body.id}`);
                        window.location.href = window.location.href.replace('new', response.data.body.id);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadApiInformation() {
                this.loading = true;
                const path = `marketing/sms/blasts/${this.$route.params.id}`;
                try {
                    const response = await axios.get(path);
                    this.name = response.data.body.name;
                    this.provider = response.data.body.service;
                    this.$nextTick( () => {
                        this.configuration = Object.assign({}, this.configuration, response.data.body.configuration);
                        this.$nextTick(() => {
                            this.$forceUpdate();
                        })
                    })
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load provider information';
                }
            },
            async loadApiProviders() {
                const path = `marketing/sms/blasts/providers`;
                try {
                    const response = await axios.get(path);
                    this.send = response.data.body;
                    this.configuration = this.send['sms'].config;
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load provider information';
                }
            },
            async loadSMSProviders() {
                const path = `marketing/sms/providers/all`;
                try {
                    const {data} = await axios.get(path);
                    this.smsProviders = data.body
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            async loadMapping() {
                this.loadedMapping = false;
                axios.get('/system/field-mapping').then( (response) => {
                    this.mapping = response.data.body;
                    this.loadedMapping = true;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            searchEditorInit:  function () {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/json')                
                require('brace/theme/chrome')
            },
            senderEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/text')                
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(false);
                this.senderEditor = editor;
            },
            editorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/text')                
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(false);
                this.messageEditor = editor;
            },
        },
        watch: {
            provider(newVal, oldVal) {
                const provider = this.send[newVal];
                if ('undefined' !== typeof(provider)) {
                    const keys = Object.keys(provider.config);
                    const defaultConfig = {};
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        defaultConfig[key] = null;
                    }
                    this.configuration = Object.assign({}, defaultConfig, this.configuration);
                    for (let key in this.configuration) {
                        if ('undefined' === typeof(provider.config[key])) {
                            delete this.configuration[key];
                        }
                    }
                } else {
                    this.configuration = {};
                }
            }
        },
        components: {
            editor: require('vue2-ace-editor'),
        }
    }
</script>