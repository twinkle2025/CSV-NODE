<template>
    <div class="card card-body" :id="`widget-${this._uid}`">
        <div class="media">
            <div class="mr-3 align-self-center">
                <i class="icon-spam icon-3x text-danger"></i>
            </div>

            <div class="media-body text-right">
                <h3 class="font-weight-semibold mb-0" v-if="null === unsubscribes">Loading</h3>
                <h3 class="font-weight-semibold mb-0" v-else>{{ unsubscribes }}</h3>
                <span to="/marketing/reports/unsubscriptions" class="text-uppercase font-size-sm text-muted">unsub<span class="d-none d-md-inline">scrib</span>ers</span>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['start', 'end'],
        data() {
            return {
                unsubscribes: null,
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
                    keys: ['unsubscribes'],
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