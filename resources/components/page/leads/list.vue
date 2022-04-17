<template>
    <section>
        <div class="card">
            <div class="card-header header-elements-inline">
                <h5 class="card-title">List of Leads</h5>
            </div>
            <div class="card-body" v-if="!this.loaded">
                <div class="alert alert-info">Loading...</div>
            </div>
            <div class="card-body" v-if="this.loaded">
                <div class="input-group mb-3" v-if="!usesAdvancedQuery">
                    <input type="search" class="form-control" placeholder="Search" v-model="search" />
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
            </div>
        </div>
        <div class="row" v-if="this.loaded">
            <div class="col-sm-4 col-xl-3">
                <div class="card">
                    <div class="card-header header-elements-inline">
                        <h6 class="card-title">Available Fields</h6>
                        <div class="header-elements">
                            <div class="list-icons">
                                <a class="list-icons-item" data-action="reload" @click="loadMapping()"></a>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <ul class="pl-0 list-unstyled">
                            <li v-for="(type, key, index) in mapping" :key="index" class="mb-1">
                                <div class="form-check">
                                    <label class="form-check-label">
                                        <input type="checkbox" class="form-check-input column-checkbox" :value="key" @change="updateDisplayColumns()" :checked="columns.indexOf(key) > -1">
                                        <i :class="getIconClassForType(type)"></i><code>{{key}}</code>
                                    </label>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="col-sm-8 col-xl-9">
                <div class="card">
                    <div class="card-header header-elements-inline">
                        <h6 class="card-title">
                            Search Results
                            <small v-if="loadedLeads" class="text-muted text-uppercase">{{totalLeads}} total results</small>
                        </h6>
                        <div class="header-elements">
                            <div class="list-icons">
                                <a class="list-icons-item" data-action="reload" @click="getSearchResults()"></a>
                            </div>
                        </div>
                    </div>
                    <div class="table-responsive mb-0 text-nowrap">
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
            </div>
        </div>
    </section>
</template>

<script>
    export default {
        data() {
            return {
                mapping: {},
                loadedMapping: false,
                loadedLeads: false,
                error: null,
                scroll: null,
                usesAdvancedQuery: false,
                search: '',
                searchQuery: '',
                columns: ['_source'],
                leads: [],
                totalLeads: 0,
                scrollLoading: false,
            }
        },
        computed: {
            loaded: function() {
                return (this.loadedMapping && this.loadedLeads);
            }
        },
        mounted() {
            //this.loadedMapping = true;
            this.loadMapping();
            this.getSearchResults();
        },
        methods: {
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
                    query = (this.usesAdvancedQuery) ? JSON.parse(this.searchQuery) : this.search;
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
                    advanced: this.usesAdvancedQuery,
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
                this.usesAdvancedQuery = !this.usesAdvancedQuery;
            },
            editorInit: function () {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/json')                
                require('brace/theme/chrome')
            },
            getIconClassForType(type) {
                let sc = '';
                switch(type) {
                    case 'boolean':
                        sc = 'fas fa-adjust mr-1'
                        break;

                    case 'keyword':
                        sc = 'fas fa-quote-left mr-1'
                        break;

                    case 'text':
                        sc = 'fas fa-quote-right mr-1'
                        break;

                    case 'date':
                        sc = 'far fa-clock mr-1'
                        break;

                    case 'integer':
                        sc = 'fas fa-hashtag mr-1'
                        break;

                    case 'ip':
                        sc = 'fas fa-network-wired mr-1'
                        break;

                    default:
                        sc = 'fas fa-question-circle mr-1'
                        break;
                }
                return sc;
            },
            async loadMapping() {
                this.loadedMapping = false;
                axios.get('/system/field-mapping').then( (response) => {
                    this.mapping = response.data.body;
                    this.loadedMapping = true;
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
                        PNotify.danger({
                            title: 'Error',
                            text: 'An unrecoverable error occured. Please contact a system administrator.',
                            type: 'danger'
                        });
                    }
                }); 
            },
            updateDisplayColumns() {
                const columns = [];
                jQuery('.column-checkbox:checked').each(function() {
                    columns.push(jQuery(this).val());
                });
                if (columns.length === 0) {
                    columns.push('_source');
                }
                this.columns = columns;
            },
            getColumnDataDisplay(columnName, source) {
                let value = '';
                if (columnName.includes('.')) {
                    // we need to split this in order get the property / value
                    try {
                        value = columnName.split('.').reduce((o,i)=>o[i], source);
                    } catch (error) {
                        value = '';
                    }
                } else {
                    value = source[columnName];
                }
                const type = this.mapping[columnName];
                switch(type) {
                    case 'boolean':
                        value = (value) ? 'TRUE' : 'FALSE';
                        break;
                }
                return value;
            }
        },
        components: {
            editor: require('vue2-ace-editor'),
        }
    }
</script>