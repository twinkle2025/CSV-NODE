<template>
    <div class="container">
        <div class="card">
            <div class="card-header header-elements-inline bg-dark text-white">
                <h5 class="card-title"><i class="icon-pulse2 mr-2"></i>Live Clicks</h5>
                <div class="header-elements">
                    <div class="list-icons">
                        <a :href="window.location.href" class="list-icons-item icon-enter6" @click="showModal()" title="Get Postback URL"></a>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <marketing-graphs-clicks height="150" />
            </div>
        </div>
        <div class="card">
            <div class="card-header header-elements-md-inline">
                <h5 class="card-title">Conversions</h5>
                <div class="header-elements d-block d-md-flex">
                    <div class="list-icons mr-2">
                        <a class="list-icons-item" @click="$emit('update-stats')" data-action="reload"></a>
                    </div>
                    <button type="button" class="btn btn-light daterange-predefined">
                        <i class="icon-calendar22 mr-2"></i>
                        <span>{{graphs.start.format('MMMM D, YYYY')}} &nbsp; - &nbsp; {{graphs.end.format('MMMM D, YYYY')}}</span>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="card">
                    <div class="card-body">
                        <marketing-graphs-daily height="300" :start="graphs.start" :end="graphs.end" />
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-6 col-md-4"><marketing-widgets-clicks :start="graphs.start" :end="graphs.end"/></div>
                    <div class="col-sm-6 col-md-4"><marketing-widgets-subs-and-regs :start="graphs.start" :end="graphs.end"/></div>
                    <div class="col-sm-6 col-md-4"><marketing-widgets-unsubscribers :start="graphs.start" :end="graphs.end"/></div>
                    <div class="col-sm-6 col-md-4"><marketing-widgets-calls :start="graphs.start" :end="graphs.end"/></div>
                    <div class="col-sm-6 col-md-4"><marketing-widgets-ftds :start="graphs.start" :end="graphs.end"/></div>
                    <div class="col-sm-6 col-md-4"><marketing-widgets-upsales :start="graphs.start" :end="graphs.end"/></div>
                </div>
            </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" :id="`modal-${this._uid}`">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-dark">
                        <h5 class="modal-title">Get Conversion URL</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Conversion Source</label>
                            <select class="form-control" v-model="modal.source">
                                <option value="general">Generic</option>
                                <option value="hasoffers">HasOffers</option>
                                <option value="panda">Panda</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="modal.source">
                            <label>Conversion Type</label>
                            <select class="form-control" v-model="modal.type">
                                <option v-if="['panda'].indexOf(modal.source) === -1" value="unsubscribe">Unsubscription</option>
                                <option v-if="['panda'].indexOf(modal.source) === -1" value="click">Click</option>
                                <option v-if="['panda'].indexOf(modal.source) === -1" value="subscription">Subscription</option>
                                <option v-if="[].indexOf(modal.source) === -1" value="registration">Registration</option>
                                <option v-if="['panda'].indexOf(modal.source) === -1" value="call">Call</option>
                                <option v-if="[].indexOf(modal.source) === -1" value="ftd">FTD</option>
                                <option v-if="['panda'].indexOf(modal.source) === -1" value="deposit">Upsale</option>
                            </select>
                        </div>
                        <div class="form-group" v-if="modal.source === 'hasoffers'">
                            <label>Network ID</label>
                            <input type="text" class="form-control" v-model="modal.network" />
                        </div>
                        <div class="form-group" v-if="modal.source === 'general'">
                            <label>Advertiser</label>
                            <input type="text" class="form-control" v-model="modal.advertiser" />
                        </div>
                        <div class="form-group" v-if="['general'].indexOf(modal.source) > -1">
                            <label>Email Placeholder</label>
                            <input type="text" class="form-control" v-model="modal.email" />
                        </div>
                        <div class="form-group" v-if="['general'].indexOf(modal.source) > -1">
                            <label>Phone Placeholder</label>
                            <input type="text" class="form-control" v-model="modal.phone" />
                        </div>
                        <div class="form-group" v-if="modal.type === 'call'">
                            <label>Disposition Placeholder</label>
                            <input type="text" class="form-control" v-model="modal.disposition" />
                        </div>
                        <tag-field v-model="modal.tags" label="Tags" v-if="modal.source" />
                        <div class="form-group" v-if="modalUrl">
                            <label>Conversion URL</label>
                            <copyable-field type="url" :value="modalUrl" readonly />
                        </div>
                        <div class="alert alert-info" v-else>
                            <span v-if="'general' === modal.source && modal.email.length === 0 && modal.phone.length === 0">You must include either an email placeholder or a phone placeholder</span>
                            <span v-else>Please fill in the form to generate conversion URL</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* .daterangepicker-inputs {
    display: none;
} */
</style>


<script>
    import socket from '../../js/socket.io';
    const numeral = require('numeral');
    const qs = require('qs');
    export default {
        data() {
            return {
                clicks: 0,
                subscriptions: 0,
                registrations: 0,
                ftds: 0,
                deposits: 0,
                unsubscribes: 0,
                calls: 0,
                answeredCalls: 0,
                modal: {
                    source: null,
                    type: null,
                    url: null,
                    method: 'get',
                    network: '',
                    advertiser: '',
                    tags: '',
                    email: '',
                    phone: '',
                    disposition: '',
                },
                window: window,
                graphs: {
                    start: moment().tz('UTC').hours(0).minutes(0).seconds(0),
                    end: moment().tz('UTC').hours(23).minutes(59).seconds(59),
                }
            }
        },
        mounted() {
            this.$nextTick(() => {
                $('.daterange-predefined').daterangepicker(
                    {
                        startDate: moment().tz('UTC').hours(0).minutes(0).seconds(0),
                        endDate: moment().tz('UTC').hours(23).minutes(59).seconds(59),
                        ranges: {
                            'Today': [moment().tz('UTC').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                            'Yesterday': [moment().tz('UTC').subtract(1, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').subtract(1, 'days').hours(23).minutes(59).seconds(59)],
                            'Last 7 Days': [moment().tz('UTC').subtract(6, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                            'Last 30 Days': [moment().tz('UTC').subtract(29, 'days').hours(0).minutes(0).seconds(0), moment().tz('UTC').hours(23).minutes(59).seconds(59)],
                            'This Month': [moment().tz('UTC').startOf('month').hours(0).minutes(0).seconds(0), moment().tz('UTC').endOf('month').hours(23).minutes(59).seconds(59)],
                            'Last Month': [moment().tz('UTC').subtract(1, 'month').startOf('month').hours(0).minutes(0).seconds(0), moment().tz('UTC').subtract(1, 'month').endOf('month').hours(23).minutes(59).seconds(59)]
                        },
                        opens: 'left',
                        applyClass: 'btn-sm bg-slate',
                        cancelClass: 'btn-sm btn-light'
                    },
                    (start, end) => {
                        $('.daterange-predefined span').html(start.format('MMMM D, YYYY') + ' &nbsp; - &nbsp; ' + end.format('MMMM D, YYYY'));
                        this.graphs.start = start.hours(0).minutes(0).seconds(0);
                        this.graphs.end = end.hours(23).minutes(59).seconds(59);
                        this.$nextTick(() => {
                            this.$emit('update-stats');
                        })
                        // we may need to tell the graphs to update
                    }
                );
            });
            jQuery(`#modal-${this._uid}`).modal({
                show: false,
            })
        },
        computed: {
            modalUrl() {
                let params;
                switch(this.modal.source) {
                    case 'hasoffers':
                        params = {
                            type: this.modal.type,
                            email: 'EMAIL',
                            network_id: this.modal.network,
                            transaction_id: 'TID',
                            offer_id: 'OID',
                            affiliate_id: 'AID',
                            advertiser_id: 'OAID',
                            tags: this.modal.tags,
                        };
                        if (!this.modal.type || !this.modal.network) {
                            return null;
                        }
                        return `${this.window.location.origin}/conversions/report/hasoffers?${qs.stringify(params)}`.replace('EMAIL', '{affiliate_unique_1}').replace('TID', '{transaction_id}').replace('OID', '{offer_id}').replace('AID', '{affiliate_id}').replace('OAID', '{advertiser_id}');

                    case 'general':
                        params = {
                            type: this.modal.type,
                            email: 'EMAIL_PLACEHOLDER',
                            phone: 'PHONE_PLACEHOLDER',
                            disposition: 'DISPOSITION_PLACEHOLDER',
                            network: this.modal.network,
                            advertiser: this.modal.advertiser,
                            tags: this.modal.tags,
                        };
                        if (0 === this.modal.email.length) {
                            delete params.email;
                        }
                        if (0 === this.modal.phone.length) {
                            delete params.phone;
                        }
                        if (0 === this.modal.disposition.length) {
                            delete params.disposition;
                        }
                        if (0 === this.modal.tags.length) {
                            delete params.tags;
                        }
                        if (null === params.network || 0 === params.network.length) {
                            delete params.network;
                        }
                        if (!this.modal.type || !this.modal.advertiser || (0 === this.modal.email.length && 0 === this.modal.phone.length)) {
                            return null;
                        }
                        return `${this.window.location.origin}/conversions/report/?${qs.stringify(params)}`.replace('EMAIL_PLACEHOLDER', this.modal.email).replace('PHONE_PLACEHOLDER', this.modal.phone).replace('DISPOSITION_PLACEHOLDER', this.modal.disposition);
                        break;

                    case 'panda':
                        params = {
                            type: this.modal.type,
                            tags: this.modal.tags,
                        };
                        if (null === this.modal.type) {
                            return null;
                        }
                        const tagString = (params.tags.length > 0) ? `/${encodeURI(params.tags)}` : '';
                        return `${this.window.location.origin}/conversions/report/panda/${params.type}${tagString}`;
                        break;

                    default:
                        return null;
                }
            }
        },
        methods: {
            showModal() {
                this.modal.source = null;
                this.modal.type = null;
                this.modal.url = null;
                this.modal.method = 'get';
                this.modal.network = '';
                this.modal.advertiser = '';
                this.modal.tags = '';
                this.modal.email = '';
                this.modal.phone = '';
                jQuery(`#modal-${this._uid}`).modal('show');
            }
        },
        beforeDestroy() {
            jQuery(`#modal-${this._uid}`).modal('dispose');
        },
    }
</script>