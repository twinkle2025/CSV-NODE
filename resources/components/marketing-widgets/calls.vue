<template>
    <div class="card card-body" :id="`widget-${this._uid}`">
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
</template>

<script>
    export default {
        props: ['start', 'end'],
        data() {
            return {
                answeredCalls: null,
                calls: null,
            }
        },
        created: function() {
            this.$parent.$on('update-stats', this.loadData);
        },
        mounted() {
            this.loadData();
        },
        methods: {
            async loadData() {
                const qs = require('qs');
                axios.get(`/marketing-dashboard/get-totals-for?${qs.stringify({
                    keys: ['answeredCalls', 'calls'],
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