<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts/highmaps';
    const geojson = require('../../maps/world-highres2.geo.json');
    const qs = require('qs');
    const moment = require('moment');
    export default {
        props: ['height', 'start', 'end'],
        data() {
            return {
                chart: null,
            }
        },
        created: function() {
            this.$parent.$on('update-stats', this.loadData);
        },
        mounted() {
            this.obj = Highcharts.mapChart(`chart-container-${this._uid}`, {
                chart: {
                    height: this.height,
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
            });
            this.loadData();
        },
        methods: {
            async loadData() {
                this.obj.showLoading('Loading Data');
                axios.get(`/marketing-dashboard/by-country?${qs.stringify({
                    start: this.start.format(),
                    end: this.end.format(),
                })}`).then( (response) => {
                    this.obj.update({
                        series: response.data.body,
                    }, true, true, true);
                    this.obj.hideLoading();
                })
                .catch( (error) => {
                    this.obj.update({
                        series: [],
                    }, true, true, true);
                    this.obj.showLoading('Error');
                    handleAxiosError(error);
                });
            }
        }
    }
</script>