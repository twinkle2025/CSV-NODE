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
                <label>Email Blast Name</label>
                <input type="text" v-model="name" readonly class="form-control form-control-lg" />
            </div>
            <div v-if="!loading && !error">
                <div class="table-responsive text-nowrap mb-3">
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
                <label>Subject</label>
                <editor v-model="configuration.subject" @init="senderEditorInit" lang="text" theme="chrome" width="100%" height="18px" class="mb-1"></editor>
                <div class="form-group">
                    <label>HTML Message Contents</label>
                    <tinymce-editor :init="htmlEditorConfig" v-model="configuration.html"></tinymce-editor>
                </div>
                <label>Text Message Contents</label>
                <editor v-model="configuration.text" @init="editorInit" lang="text" theme="chrome" width="100%" height="400px" class="mb-1"></editor>
            </div>
        </div>
    </div>
</template>

<script>
    import { setTimeout } from 'timers';
    export default {
        data() {
            return {
                htmlEditorConfig: {
                    plugins : 'advlist autolink link image lists charmap code preview hr image legacyoutput paste quickbars searchreplace table visualblocks visualchars wordcount',
                    init_instance_callback: (editor) => {
                        this.htmlEditor = editor;
                    }
                },
                htmlEditor: null,
                scrollLoading: false,
                loadedLeads: false,
                mailMergeVal: null,
                htmlMailMergeVal: null,
                senderMailMergeVal: null,
                mapping: {},
                loadedMapping: false,
                senderEditor: null,
                messageEditor: null,
                title: 'Email Blast',
                name: null,
                loading: true,
                error: null,
                send: {},
                provider: 'email',
                configuration: {
                    subject: '',
                    text: '',
                    html: '',
                    manual_recipients: '',
                    recipient_query: {
                        search: '',
                        usesAdvancedQuery: false,
                        searchQuery: '',
                    },
                    send_at: {
                        time: null,
                        local: false,
                    }
                },
                emailProviders: {},
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
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create an Email Blast' : `View Email Blast #${this.$route.params.id} Report`;
            await this.loadApiInformation();
            if ('undefined' !== typeof(this.$route.params.id)) {
                await new Promise( async (resolve) => {
                    await this.loadMapping();
                    this.loading = false;
                    this.loadSendAt();
                    resolve();
                })
            } else {
                await this.loadMapping();
                this.$nextTick(() => {
                    this.loading = false;
                    this.loadSendAt();
                });
            }
        },
        methods: {
            async loadApiInformation(setLoading) {
                this.loading = true;
                const path = `marketing/email/blasts/${this.$route.params.id}`;
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
            addMailMergeValueToHTML() {
                if (this.htmlMailMergeVal) {
                    tinymce.activeEditor.execCommand('mceInsertContent', false, this.htmlMailMergeVal);
                    this.htmlMailMergeVal = null;
                }
            },
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the Email Blast. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? 'marketing/email/queue/' : `marketing/email/queue/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            service: 'email',
                            configuration: this.configuration,
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved Email Blast Successfully.',
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
                    // this.$router.push(`/marketing/email/queue/`);
                    swal.close();
                } catch (error) {
                    swal.close();
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