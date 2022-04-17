<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts';
    const _ = require('lodash');
    export default {
        props: ['type', 'config', 'value'],
        data() {
            return {
                chart: null,
                defaultConfig: {
                    title: {
                        text: null,
                    },
                    credits: {
                        enabled: false,
                    },
                    series: [],
                }
            }
        },
        mounted() {
            ///{...this.defaultConfig, ...this.config}
            // const config = Object.assign({}, this.defaultConfig, this.config);
            const config = _.merge(this.defaultConfig, this.config);
            this.chart = Highcharts.chart(`chart-container-${this._uid}`, config);
            this.chart.showLoading('Loading');
            this.$nextTick(() => {
                this.$emit('input', this.chart)
            });
        }
    }
</script>