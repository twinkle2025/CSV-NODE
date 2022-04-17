<template>
    <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
</template>

<script>
    import Highcharts from 'highcharts';
    export default {
        props: ['height'],
        data() {
            return {
                chart: null,
            }
        },
        created: function() {
            this.$parent.$on('update-tags', this.loadData);
        },
        mounted() {
            this.obj = Highcharts.chart(`chart-container-${this._uid}`, {
                chart: {
                    height: this.height,
                    type: 'column'
                },
                title: {
                    text: null,
                },
                credits: {
                    enabled: false,
                },
                xAxis: {
                    categories: [
                        '',
                    ],
                    crosshair: true,
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Leads',
                    }
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: [],
            });
            this.loadData();
        },
        methods: {
            async loadData() {
                this.obj.showLoading('Loading Data');
                axios.get('/dashboard/tags', ).then( (response) => {
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