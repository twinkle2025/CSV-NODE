<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">{{title}}</h5>
            <div class="header-elements" v-if="!loading && !error">
                <div class="list-icons">
                    <a class="list-icons-item" @click="loadApiInformation(true)" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading && !error">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div class="loading" v-if="!loading && !error">
                <div class="row">
                    <div class="col-12">
                        <div class="form-group">
                            <label>Sent Via</label>
                            <p style="font-size: 0.9rem; font-strength: 700;">{{providerName}}</p>
                        </div>
                        <div class="form-group">
                            <label>Sender</label><br />
                            <code>{{configuration.subject}}</code>
                        </div>
                        <div class="form-group">
                            <label>Message</label>
                            <pre>{{configuration.body}}</pre>
                        </div>
                        <div class="table-responsive text-nowrap">
                            <table class="table table-bordered table-stripped table-hover table-xs">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(info, index) in results" :key="index">
                                        <th>{{info.status}}</th>
                                        <td>{{info.total}}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                loadedLeads: false,
                mailMergeVal: null,
                senderMailMergeVal: null,
                mapping: {},
                loadedMapping: false,
                senderEditor: null,
                messageEditor: null,
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
                results: [],
            }
        },
        async mounted() {
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
        computed: {
            title() {
                return (this.loading || this.error) ? `View Report for SMS Blast #${this.$route.params.id}` : `View Report for SMS Blast "${this.name}"`;
            },
            providerName() {
                let ret = '';
                for (let i = 0; i < this.smsProviders.length; i++) {
                    const info = this.smsProviders[i];
                    if (info.id == this.configuration.provider) {
                        ret = info.name;
                    }
                }
                return ret;
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
                        this.$router.push(`/marketing/sms/send/${response.data.body.id}`);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadApiInformation(setLoading) {
                this.loading = true;
                const path = `marketing/sms/blasts/${this.$route.params.id}`;
                try {
                    const response = await axios.get(path);
                    this.name = response.data.body.name;
                    this.provider = response.data.body.service;
                    this.results = response.data.body.results;
                    this.$nextTick( () => {
                        this.configuration = Object.assign({}, this.configuration, response.data.body.configuration);
                        this.$nextTick(() => {
                            if (setLoading) {
                                this.loading = false;
                            }
                            this.$forceUpdate();
                        })
                    })
                } catch (error) {
                    handleAxiosError(error);
                    if (setLoading) {
                        this.loading = false;
                    }
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