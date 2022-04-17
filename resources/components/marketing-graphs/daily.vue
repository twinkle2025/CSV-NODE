<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts';
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
            this.obj = Highcharts.chart(`chart-container-${this._uid}`, {
                chart: {
                    height: this.height,
                    type: 'line',
                },
                title: {
                    text: null,
                },
                credits: {
                    enabled: false,
                },
                xAxis: {
                    type: 'datetime',
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Conversions',
                    }
                },
                series: [],
            });
            this.loadData();
        },
        methods: {
            async loadData() {
                this.obj.update({
                    series: [],
                }, true, true, true);
                this.obj.showLoading('Loading Data');
                axios.get(`/marketing-dashboard/daily?${qs.stringify({
                    start: this.start.format(),
                    end: this.end.format(),
                })}`).then( (response) => {
                    this.obj.update({
                        series: response.data.body,
                    }, true, true, true);
                    this.$nextTick(() => {
                        this.obj.redraw(true);
                        this.obj.hideLoading();
                    })
                })
                .catch( (error) => {
                    this.obj.update({
                        series: [],
                    }, true, true, true);
                    this.$nextTick(() => {
                        this.obj.redraw(true);
                        this.obj.showLoading('Error');
                    })
                    handleAxiosError(error);
                });
            }
        }
    }
</script>