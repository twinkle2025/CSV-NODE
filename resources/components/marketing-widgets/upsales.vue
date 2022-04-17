<template>
    <div class="card card-body" :id="`widget-${this._uid}`">
        <div class="media">
            <div class="mr-3 align-self-center">
                <i class="icon-coins icon-3x text-success-800"></i>
            </div>

            <div class="media-body text-right">
                <h3 class="font-weight-semibold mb-0" v-if="null === deposits">Loading</h3>
                <h3 class="font-weight-semibold mb-0" v-else>{{ deposits }}</h3>
                <router-link to="/marketing/reports/upsales" class="text-uppercase font-size-sm text-muted">upsold</router-link>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['start', 'end'],
        data() {
            return {
                deposits: null,
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
                    keys: ['deposits'],
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