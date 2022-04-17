<template>
    <div class="card card-body" :id="`widget-${this._uid}`">
        <div class="media">
            <div class="mr-3 align-self-center">
                <i class="icon-coin-dollar icon-3x text-success-400"></i>
            </div>

            <div class="media-body text-right">
                <h3 class="font-weight-semibold mb-0" v-if="null === ftds">Loading</h3>
                <h3 class="font-weight-semibold mb-0" v-else>{{ ftds }}</h3>
                <router-link to="/marketing/reports/ftds" class="text-uppercase font-size-sm text-muted">ftders</router-link>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['start', 'end'],
        data() {
            return {
                ftds: null,
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
                    keys: ['ftds'],
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