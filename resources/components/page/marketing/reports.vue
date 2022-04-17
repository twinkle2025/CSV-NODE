<template>
    <div :class="contentClass">
        <div v-if="!loadedData || !loadedLayout" class="lds-ring"><div></div><div></div><div></div><div></div></div>
        <div v-else class="row">
            <div class="col-md-3 col-xl-2">
                <div class="card">
                    <div class="card-header header-elements-md-inline">
                        <h5 class="card-title">
                            Filters
                        </h5>
                    </div>
                    <div class="card-body">
                        <p v-if="null !== total">Total Results: {{numeral(total).format('0,0')}}</p>
                        <div class="btn-group btn-group-sm mb-2 d-flex justify-content-between align-items-center">
                            <button type="button" class="btn flex-fill btn-outline-success" @click="getReportData()">Apply</button>
                            <button type="button" class="btn flex-fill btn-outline-danger" @click="clearFilters()">Clear</button>
                        </div>
                        <div class="form-group">
                            <label>Date Range</label>
                            <button type="button" class="btn btn-block btn-light daterange-predefined">
                                <i class="icon-calendar22 mr-2"></i>
                                <span>{{filters.date.gte.format('MMMM D, YYYY')}} &nbsp; - &nbsp; {{filters.date.lte.format('MMMM D, YYYY')}}</span>
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Countries</label>
                            <searchable-select v-model="filters.countries" multiple>
                                <option v-for="(name, key) in countries" :key="key.toUpperCase()" :value="key.toUpperCase()">{{name}} ({{key.toUpperCase()}})</option>
                            </searchable-select>
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <div class="input-group">
                                <input type="email" v-model="filters.email_address.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.email_address.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <label>Email Domain</label>
                            <div class="input-group">
                                <div class="input-group-prepend">
                                    <span class="input-group-text">@</span>
                                </div>
                                <input type="text" v-model="filters.email_domain.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.email_domain.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <div class="input-group">
                                <input type="email" v-model="filters.phone_number" class="form-control">
                            </div>
                        </div>
                        <tag-field v-model="filters.tags" label="Tags" v-if="['clicks'].indexOf($route.params.type) === -1" />
                        <div class="form-group" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <label>IP Address / CIDR Range</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.ip_address" class="form-control">
                            </div>
                        </div>
                        <div class="form-group" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <label>User Agent</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.user_agent.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.user_agent.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <label>Source</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.source.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.source.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <label>Sub-Source</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.sub.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.sub.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <label>Network</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.network.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.network.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <label>Funnel</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.funnel.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.funnel.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['clicks', 'subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <label>Affiliate</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.affiliate.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.affiliate.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['ftds', 'upsales'].indexOf($route.params.type) > -1">
                            <label>Broker</label>
                            <div class="input-group">
                                <input type="text" v-model="filters.broker.value" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text"><input v-model="filters.broker.exact" type="checkbox" class="mr-2" aria-label="Exact Match">Exact</span>
                                </div>
                            </div>
                        </div>
                        <div class="form-group" v-if="['ftds', 'upsales'].indexOf($route.params.type) > -1">
                            <label>Amount</label>
                            <div class="input-group">
                                <input type="number" min="0" step="any" steps="any" v-model="filters.amount.gte" class="form-control">
                                <div class="input-group-append">
                                    <span class="input-group-text">to</span>
                                </div>
                                <input type="number" min="0" step="any" steps="any" v-model="filters.amount.lte" class="form-control">
                            </div>
                        </div>
                        <csv-tags-field v-model="filters.currencies" label="Currencies" v-if="['ftds', 'upsales'].indexOf($route.params.type) > -1" />
                        <div class="btn-group btn-group-sm d-flex justify-content-between align-items-center">
                            <button type="button" class="btn flex-fill btn-outline-success" @click="getReportData()">Apply</button>
                            <button type="button" class="btn flex-fill btn-outline-danger" @click="clearFilters()">Clear</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-9 col-xl-10">
                <div class="card">
                    <div class="card-header header-elements-md-inline">
                        <h5 class="card-title">
                            {{reportTitle}}
                        </h5>
                        <div class="header-elements d-block d-md-flex">
                            <div class="list-icons mr-2">
                                <a class="list-icons-item" @click="getReportData()" data-action="reload"></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Histograph</h6>
                            </div>
                            <highchart v-model="charts.histograph" :config="{chart:{type:'line'},xAxis:{type:'datetime'},yAxis:{min:0,title:{text:null}},tooltip:{headerFormat:'<b>{series.name}</b><br/>',pointFormat:'{point.x:%d.%m.%Y %H:%M}<br/>{point.y:.0f}'},legend:{enabled:false},exporting:{enabled:false}}" class="card-body histograph-chart-container"></highchart>
                        </div>
                        <div class="card">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Geograph</h6>
                            </div>
                            <highmap v-model="charts.geograph" class="card-body geograph-chart-container"></highmap>
                        </div>
                        <div class="row">
                            <div class="col-md-6"  v-if="['clicks'].indexOf($route.params.type) > -1">
                                <div class="card">
                                    <div class="card-header header-elements-md-inline bg-dark text-white">
                                        <h6 class="card-title">Top Sources</h6>
                                    </div>
                                    <highchart v-model="charts.topSources" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                                </div>
                            </div>
                            <div class="col-md-6"  v-if="['clicks'].indexOf($route.params.type) > -1">
                                <div class="card">
                                    <div class="card-header header-elements-md-inline bg-dark text-white">
                                        <h6 class="card-title">Top Sub-Sources</h6>
                                    </div>
                                    <highchart v-model="charts.topSubSources" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                                </div>
                            </div>
                            <div class="col-md-6"  v-if="['clicks'].indexOf($route.params.type) > -1">
                                <div class="card">
                                    <div class="card-header header-elements-md-inline bg-dark text-white">
                                        <h6 class="card-title">Top Offers</h6>
                                    </div>
                                    <highchart v-model="charts.topOffers" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                                </div>
                            </div>
                            <div class="col-md-6"  v-if="['clicks'].indexOf($route.params.type) > -1">
                                <div class="card">
                                    <div class="card-header header-elements-md-inline bg-dark text-white">
                                        <h6 class="card-title">Top URLs</h6>
                                    </div>
                                    <highchart v-model="charts.topUrls" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                                </div>
                            </div>
                        </div>
                        <div class="row" v-if="['clicks'].indexOf($route.params.type) === -1">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header header-elements-md-inline bg-dark text-white">
                                        <h6 class="card-title">Query</h6>
                                    </div>
                                    <editor v-model="query" @init="editorInit" lang="json" theme="chrome" width="100%" height="500px"></editor>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Browsers</h6>
                            </div>
                            <highchart v-model="charts.topBrowsers" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Email Domains</h6>
                            </div>
                            <highchart v-model="charts.topDomains" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Networks</h6>
                            </div>
                            <highchart v-model="charts.topNetworks" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Funnels</h6>
                            </div>
                            <highchart v-model="charts.topFunnels" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['clicks', 'subscriptions', 'registrations'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Affiliates</h6>
                            </div>
                            <highchart v-model="charts.topAffiliates" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['ftds', 'upsales'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Brokers</h6>
                            </div>
                            <highchart v-model="charts.topBrokers" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['ftds', 'upsales'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Currencies</h6>
                            </div>
                            <highchart v-model="charts.topCurrencies" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['clicks'].indexOf($route.params.type) === -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Tags</h6>
                            </div>
                            <highchart v-model="charts.topTags" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                        <div class="card" v-if="['clicks'].indexOf($route.params.type) > -1">
                            <div class="card-header header-elements-md-inline bg-dark text-white">
                                <h6 class="card-title">Top Redirect Domains</h6>
                            </div>
                            <highchart v-model="charts.topRedirectDomains" :config="{chart:{type:'column'},title:{text:null,},credits:{enabled:false,},xAxis:{categories:['',],crosshair:true,},yAxis:{min:0,title:{text:null}},plotOptions:{column:{pointPadding:0.2,borderWidth:0}},series:[]}" class="card-body top-chart-container" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.page-content:not(.container){
    padding-left: 15px;
    padding-right: 15px;
}

.full-height-content {
    height: calc(100vh - 192px - 2.5rem - 1.25rem);
}

.full-width-btn-group {
    width: 100%;
}

.btn.daterange-predefined {
    overflow-x: hidden;
}

.histograph-chart-container {
    min-height: 15vh;
}
.geograph-chart-container {
    min-height: 35vh;
}

.top-chart-container {
    min-height: 25vh;
}
</style>


<script>
    const numeral = require('numeral');
    const countryList = require('country-list');
    export default {
        data() {
            return {
                loadedLayout: true,
                loadedData: false,
                dateRangeInitialized: false,
                countries: countryList.getCodeList(),
                total: null,
                query: null,
                filters: {
                    countries: [],
                    email_address: {
                        value: null,
                        exact: false,
                    },
                    email_domain: {
                        value: null,
                        exact: false,
                    },
                    phone_number: null,
                    email_domain: {
                        value: null,
                        exact: false,
                    },
                    ip_address: null,
                    user_agent: {
                        value: null,
                        exact: false,
                    },
                    source: {
                        value: null,
                        exact: false,
                    },
                    sub: {
                        value: null,
                        exact: false,
                    },
                    network: {
                        value: null,
                        exact: false,
                    },
                    funnel: {
                        value: null,
                        exact: false,
                    },
                    affiliate: {
                        value: null,
                        exact: false,
                    },
                    broker: {
                        value: null,
                        exact: false,
                    },
                    amount: {
                        gte: null,
                        lte: null,
                    },
                    currencies: '',
                    tags: '',
                    date: {
                        gte: moment().tz('UTC').hours(0).minutes(0).seconds(0),
                        lte: moment().tz('UTC').hours(23).minutes(59).seconds(59),
                    }
                },
                defaultFilters: {
                    countries: [],
                    email_address: {
                        value: null,
                        exact: false,
                    },
                    email_domain: {
                        value: null,
                        exact: false,
                    },
                    phone_number: null,
                    email_domain: {
                        value: null,
                        exact: false,
                    },
                    ip_address: null,
                    user_agent: {
                        value: null,
                        exact: false,
                    },
                    source: {
                        value: null,
                        exact: false,
                    },
                    sub: {
                        value: null,
                        exact: false,
                    },
                    network: {
                        value: null,
                        exact: false,
                    },
                    funnel: {
                        value: null,
                        exact: false,
                    },
                    affiliate: {
                        value: null,
                        exact: false,
                    },
                    broker: {
                        value: null,
                        exact: false,
                    },
                    amount: {
                        gte: null,
                        lte: null,
                    },
                    currencies: '',
                    tags: '',
                },
                charts: {
                    histograph: null,
                    geograph: null,
                    topBrowsers: null,
                    topDomains: null,
                    topOffers: null,
                    topRedirectDomains: null,
                    topSources: null,
                    topSubSources: null,
                    topUrls: null,
                    topNetworks: null,
                    topFunnels: null,
                    topAffiliates: null,
                    topTags: null,
                    topBrokers: null,
                    topCurrencies: null,
                },
                numeral
            }
        },
        mounted() {
            this.getReportData();
        },
        computed: {
            contentClass() {
                if (!this.loadedLayout || !this.loadedData) {
                    return 'content d-flex justify-content-center align-items-center full-height-content';
                } else {
                    return 'container-fluid';
                }
            },
            reportTitle() {
                const titleCase = require('title-case');
                return `${titleCase(this.$route.params.type)} Report`;
            }
        },
        components: {
            editor: require('vue2-ace-editor'),
        },
        methods: {
            editorInit: function (editor) {
                require('brace/ext/language_tools')
                require('brace/mode/json')                
                require('brace/theme/chrome')
                editor.setReadOnly(true);
                editor.setShowPrintMargin(false);
            },
            clearFilters() {
                for (let key in this.defaultFilters) {
                    this.filters[key] = this.defaultFilters[key];
                }
                this.$nextTick(() => {
                    this.$forceUpdate();
                })
            },
            async getReportData() {
                this.loadedData = false;
                this.total = null;
                try {
                    const {data} = await axios.post(`/marketing/reports/${this.$route.params.type}`, this.filters);
                    // console.log(data.body);
                    this.total = data.body.total;
                    this.query = JSON.stringify({query: data.body.query}, null, 2);
                    this.loadedData = true;
                    setTimeout(() => {
                        for (let key in data.body) {
                            if ('object' === typeof(this.charts[key]) && null !== this.charts[key]) {
                                this.charts[key].update({
                                    series: data.body[key],
                                }, true, true, true);
                                this.charts[key].hideLoading();
                            }
                        }
                        for (let key in this.charts) {
                            const byIdKey = `${key}ById`;
                            const byNameKey = `${key}ByName`;
                            if ('undefined' !== typeof(data.body[byIdKey]) && 'undefined' !== typeof(data.body[byNameKey])) {
                                const serieses = [...data.body[byIdKey], ...data.body[byNameKey]];
                                this.charts[key].update({
                                    series: serieses,
                                }, true, true, true);
                                this.charts[key].hideLoading();
                            }
                            else if ('undefined' !== typeof(data.body[byIdKey]) && 'undefined' === typeof(data.body[byNameKey])) {
                                this.charts[key].update({
                                    series: data.body[byIdKey],
                                }, true, true, true);
                                this.charts[key].hideLoading();
                            }
                            else if ('undefined' === typeof(data.body[byIdKey]) && 'undefined' !== typeof(data.body[byNameKey])) {
                                this.charts[key].update({
                                    series: data.body[byNameKey],
                                }, true, true, true);
                                this.charts[key].hideLoading();
                            }
                        }
                    }, 500);
                    this.initializeDateRange();
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            initializeDateRange() {
                if (!this.dateRangeInitialized) {
                    this.$nextTick(() => {
                        $('.daterange-predefined').daterangepicker(
                            {
                                startDate: this.filters.date.gte,
                                endDate: this.filters.date.lte,
                                ranges: {
                                    'Today': [moment().tz('UTC').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                                    'Yesterday': [moment().tz('UTC').subtract(1, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').subtract(1, 'days').hours(23).minutes(59).seconds(59)],
                                    'Last 7 Days': [moment().tz('UTC').subtract(6, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                                    'Last 30 Days': [moment().tz('UTC').subtract(29, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                                    'This Month': [moment().tz('UTC').startOf('month').hours(0).minutes(0).seconds(0), moment().tz('UTC').endOf('month').hours(23).minutes(59).seconds(59)],
                                    'Last Month': [moment().tz('UTC').subtract(1, 'month').startOf('month').hours(0).minutes(0).seconds(0), moment().tz('UTC').subtract(1, 'month').endOf('month').hours(23).minutes(59).seconds(59)]
                                },
                                opens: 'right',
                                applyClass: 'btn-sm bg-slate',
                                cancelClass: 'btn-sm btn-light'
                            },
                            (start, end) => {
                                $('.daterange-predefined span').html(start.format('MMMM D, YYYY') + ' &nbsp; - &nbsp; ' + end.format('MMMM D, YYYY'));
                                this.filters.date.gte = start.hours(0).minutes(0).seconds(0);
                                this.filters.date.lte = end.hours(23).minutes(59).seconds(59);
                                this.$nextTick(() => {
                                    this.getReportData();
                                })
                            }
                        );
                    });
                }
            }
        }
    }
</script>