<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts/highmaps';
    const geojson = require('../maps/world-highres2.geo.json');
    const _ = require('lodash');
    export default {
        props: ['type', 'config', 'value'],
        data() {
            return {
                chart: null,
                defaultConfig: {
                    chart: {
                        map: geojson
                    },
                    title: {
                        text: null,
                    },
                    credits: {
                        enabled: false,
                    },
                    mapNavigation: {
                        enabled: true,
                        buttonOptions: {
                            verticalAlign: 'bottom'
                        }
                    },
                    colorAxis: {
                        tickPixelInterval: 100
                    },
                    series: [],
                }
            }
        },
        mounted() {
            const config = _.merge(this.defaultConfig, this.config);
            this.chart = Highcharts.mapChart(`chart-container-${this._uid}`, config);
            this.chart.showLoading('Loading');
            this.$nextTick(() => {
                this.$emit('input', this.chart)
            });
        }
    }
</script>