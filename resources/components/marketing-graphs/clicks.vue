<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts';
    const qs = require('qs');
    const moment = require('moment');
    import socket from '../../js/socket.io';
    export default {
        props: ['height'],
        data() {
            return {
                obj: null,
                clicksThisSecond: 0,
                interval: null,
            }
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
                        text: null,
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br/>',
                    pointFormat: '{point.x:%d.%m.%Y %H:%M}<br/>{point.y:.0f}'
                },
                legend: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: 'Live Clicks',
                    data: [],
                }],
            });
            this.obj.showLoading('Loading');
            this.interval = setInterval(() => {
                this.pushLastSecond();
            }, 60000);
            socket.on('click-generated', (click_id) => {
                this.clicksThisSecond ++;
                this.updateLastSecond();
            });
            axios.get('/marketing-dashboard/clicks-last-hour').then(({data}) => {
                this.obj.update({
                    series: [{
                        name: 'Live Clicks',
                        data: data.body,
                    }],
                }, true, true, true);
                this.obj.hideLoading();
            }).catch((error) => {
                this.obj.showLoading('Error');
            });
        },
        methods: {
            pushLastSecond() {
                this.clicksThisSecond = 0;
                if ('object' === typeof(this.obj) && null !== this.obj) {
                    const series = this.obj.series[0];
                    const x = (new Date()).getTime();
                    const y = this.clicksThisSecond;
                    series.addPoint([x, y], true, true);
                }
            },
            updateLastSecond() {
                if ('object' === typeof(this.obj) && null !== this.obj) {
                    const series = this.obj.series[0];
                    series.points[series.points.length - 1].update({
                        y: this.clicksThisSecond,
                    });
                }
            }
        },
        beforeDestroy() {
            clearInterval(this.interval);
        },
    }
</script>