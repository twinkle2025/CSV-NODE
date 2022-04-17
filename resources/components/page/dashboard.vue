<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6 col-xl-3">
                <total-leads-widget :totalLeads="totalLeads" />
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-envelop4 icon-3x text-orange-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === validEmails">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ validEmails }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">emails</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-mobile icon-3x text-primary-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === validMobilePhones">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ validMobilePhones }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">mobile phones</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-xl-3">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-phone icon-3x text-teal-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === validLandlinePhones">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ validLandlinePhones }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">landline phones</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-xl-8">
                <div class="card">
                    <div class="card-header header-elements-inline">
                        <h5 class="card-title">Leads per Country</h5>
                        <div class="header-elements">
                            <div class="list-icons">
                                <a class="list-icons-item" @click="$emit('update-countries')" data-action="reload"></a>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <top-countries-chart :height="400" />
                    </div>
                </div>
            </div>
            <div class="col-xl-4">
                <div class="card">
                    <div class="card-header header-elements-inline">
                        <h5 class="card-title">Top Tags</h5>
                        <div class="header-elements">
                            <div class="list-icons">
                                <a class="list-icons-item" @click="$emit('update-tags')" data-action="reload"></a>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <top-tags-chart :height="400" />
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-touch icon-3x text-primary-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === clicks">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ clicks }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">clickers</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-user icon-3x text-teal-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === subscriptions || null === registrations">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ subscriptions }} / {{registrations}}</h3>
                            <span class="text-uppercase font-size-sm text-muted">sub<span class="d-none d-md-inline">scribers</span> / reg<span class="d-none d-md-inline">istrator</span>s</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-spam icon-3x text-danger"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === unsubscribes">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ unsubscribes }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">unsub<span class="d-none d-md-inline">scrib</span>ers</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-phone-outgoing icon-3x text-success"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === answeredCalls || null === calls">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ answeredCalls }} / {{ calls }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">answerers<span class="d-none d-md-inline">/ non answerers</span></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-coin-dollar icon-3x text-success-400"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === ftds || null === qualifiedFtd">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{qualifiedFtd}} / {{ ftds }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">$1,000+ <span class="d-none d-md-inline">ftded</span> / <span class="d-none d-md-inline">ftded</span></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-md-4">
                <div class="card card-body">
                    <div class="media">
                        <div class="mr-3 align-self-center">
                            <i class="icon-coins icon-3x text-success-800"></i>
                        </div>

                        <div class="media-body text-right">
                            <h3 class="font-weight-semibold mb-0" v-if="null === deposits">Loading</h3>
                            <h3 class="font-weight-semibold mb-0" v-else>{{ deposits }}</h3>
                            <span class="text-uppercase font-size-sm text-muted">upsold</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <page-lists-processing />
    </div>
</template>

<script>
    import socket from '../../js/socket.io';
    const numeral = require('numeral');
    export default {
        data() {
            return {
                totalLeads: null,
                validEmails: null,
                validMobilePhones: null,
                validLandlinePhones: null,
                clicks: null,
                subscriptions: null,
                registrations: null,
                qualifiedFtd: null,
                ftds: null,
                deposits: null,
                unsubscribes: null,
                calls: null,
                answeredCalls: null,
            }
        },
        mounted() {
            socket.on('total-leads', (leadCount) => {
                this.totalLeads = numeral(leadCount).format('0,0');
            });
            socket.on('total-emails', (leadCount) => {
                this.validEmails = numeral(leadCount).format('0,0');
            });
            socket.on('total-mobile-phones', (leadCount) => {
                this.validMobilePhones = numeral(leadCount).format('0,0');
            });
            socket.on('total-landline-phones', (leadCount) => {
                this.validLandlinePhones = numeral(leadCount).format('0,0');
            });
            socket.on('total-conversions-clicks', (count) => {
                this.clicks = numeral(count).format('0,0');
            })
            socket.on('total-conversions-subscriptions', (count) => {
                this.subscriptions = numeral(count).format('0,0');
            })
            socket.on('total-conversions-registrations', (count) => {
                this.registrations = numeral(count).format('0,0');
            })
            socket.on('total-conversions-ftds', (count) => {
                this.ftds = numeral(count).format('0,0');
            })
            socket.on('total-qualified-conversions-ftds', (count) => {
                this.qualifiedFtd = numeral(count).format('0,0');
            })
            socket.on('total-conversions-deposits', (count) => {
                this.deposits = numeral(count).format('0,0');
            })
            socket.on('total-conversions-unsubscribes', (count) => {
                this.unsubscribes = numeral(count).format('0,0');
            })
            socket.on('total-conversions-calls', (count) => {
                this.calls = numeral(count).format('0,0');
            })
            socket.on('total-conversions-answered-calls', (count) => {
                this.answeredCalls = numeral(count).format('0,0');
            })
        },
        methods: {
            
        },
        beforeDestroy() {
            socket.off('total-leads');
            socket.off('total-emails');
            socket.off('total-mobile-phones');
            socket.off('total-landline-phones');
            socket.off('total-conversions-clicks');
            socket.off('total-conversions-subscriptions');
            socket.off('total-conversions-registrations');
            socket.off('total-conversions-ftds');
            socket.off('total-conversions-deposits');
            socket.off('total-qualified-conversions-ftds');
        },
    }
</script>