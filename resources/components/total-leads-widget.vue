<template>
    <div class="card card-body position-relative hide-v-overflow">
        <div class="media z-index-higher">
            <div class="mr-3 align-self-center">
                <i class="icon-person icon-3x text-success-400"></i>
            </div>

            <div class="media-body text-right">
                <h3 class="font-weight-semibold mb-0" v-if="null === totalLeads">Loading</h3>
                <h3 class="font-weight-semibold mb-0" v-else>{{ totalLeads }}</h3>
                <span class="text-uppercase font-size-sm text-muted">total leads</span>
            </div>
        </div>
        <div class="chart-container behind-content position-absolute graph-in-widget" :id="`chart-container-${this._uid}`"></div>
    </div>
</template>

<script>
    import Highcharts from 'highcharts';
    import socket from '../js/socket.io';
    export default {
        props: ['totalLeads'],
        data() {
            return {
                chart: null,
                leadsThisSecond: 0,
            }
        },
        created: function() {},
        beforeDestroy() {
            socket.off('imports-this-second');
        },
        mounted() {
            socket.on('imports-this-second', (count) => {
                this.leadsThisSecond = count;
            });
            const obj = this;
            this.chart = Highcharts.chart(`chart-container-${this._uid}`, {
                chart: {
                    type: 'spline',
                },
                time: {
                    useUTC: false
                },
                title: {
                    text: null,
                },
                credits: {
                    enabled: false,
                },
                xAxis: {
                    visible: false,
                    type: 'datetime',
                    tickPixelInterval: 150,
                },
                yAxis: {
                    visible: false,
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }],
                    title: {
                        text: '',
                    }
                },
                legend: {
                    enabled: false,
                },
                series: [{
                    name: 'Leads per Second',
                    data: (function () {
                        // generate an array of random data
                        var data = [],
                            time = (new Date()).getTime(),
                            i;

                        for (i = -19; i <= 0; i += 1) {
                            data.push({
                                x: time + i * 1000,
                                y: 0
                            });
                        }
                        return data;
                    }())
                }],
            });
            setInterval(this.updateChart, 1000);
            this.updateChart();
        },
        methods: {
            updateChart: function() {
                if ('object' === typeof(this.chart) && 'undefined' !== typeof(this.chart.series) && 'undefined' !== typeof(this.chart.series[0])) {
                    const series = this.chart.series[0];
                    const x = (new Date()).getTime();
                    const y = this.leadsThisSecond;
                    const res = series.addPoint([x, y], true, true);
                } else {
                    console.log('Chart not initialized yet');
                }
            }
        }
    }
</script>