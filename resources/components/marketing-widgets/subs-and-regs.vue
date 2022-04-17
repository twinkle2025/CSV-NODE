<template>
    <div class="card card-body" :id="`widget-${this._uid}`">
        <div class="media">
            <div class="mr-3 align-self-center">
                <i class="icon-user icon-3x text-teal-400"></i>
            </div>

            <div class="media-body text-right">
                <h3 class="font-weight-semibold mb-0" v-if="null === subscriptions || null === registrations">Loading</h3>
                <h3 class="font-weight-semibold mb-0" v-else>{{ subscriptions }} / {{registrations}}</h3>
                <span class="text-uppercase font-size-sm text-muted"><router-link class="text-muted" to="/marketing/reports/subscriptions">sub<span class="d-none d-md-inline">scribers</span></router-link> / <router-link class="text-muted" to="/marketing/reports/registrations" >reg<span class="d-none d-md-inline">istrator</span>s</router-link></span>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['start', 'end'],
        data() {
            return {
                subscriptions: null,
                registrations: null,
            }
        },
        mounted() {
            this.loadData();
        },
        created: function() {
            this.$parent.$on('update-stats', this.loadData);
        },
        methods: {
            async loadData() {
                const qs = require('qs');
                axios.get(`/marketing-dashboard/get-totals-for?${qs.stringify({
                    keys: ['subscriptions', 'registrations'],
                    start: this.start.format(),
                    end: this.end.format(),
                })}`).then( ({data}) => {
                    for (let key in data.body) {
                        if ('undefined' !== typeof(this[key])) {
                            this[key] = data.body[key];
                        }
                    }
                })
                .catch( (error) => {
                    handleAxiosError(error);
                });
            }
        }
    }
</script>