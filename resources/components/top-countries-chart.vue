<template>
    <div>
        <ul class="nav nav-tabs nav-fill mb-0">
            <li class="nav-item">
                <a :class="null === filter ? 'nav-link active' : 'nav-link'" @click="changeFilter(null)">All Leads</a>
            </li>
            <li class="nav-item">
                <a :class="'emails' === filter ? 'nav-link active' : 'nav-link'" @click="changeFilter('emails')">Emails</a>
            </li>
            <li class="nav-item">
                <a :class="'all-phones' === filter ? 'nav-link active' : 'nav-link'" @click="changeFilter('all-phones')">Valid Phones</a>
            </li>
            <li class="nav-item">
                <a :class="'mobile-phones' === filter ? 'nav-link active' : 'nav-link'" @click="changeFilter('mobile-phones')">Mobile Phones</a>
            </li>
            <li class="nav-item">
                <a :class="'landline-phones' === filter ? 'nav-link active' : 'nav-link'" @click="changeFilter('landline-phones')">Landline Phones</a>
            </li>
        </ul>
        <div class="chart-container" :id="`chart-container-${this._uid}`"></div>
    </div>
</template>

<script>
    import Highcharts from 'highcharts/highmaps';
    const geojson = require('../maps/world-highres2.geo.json');
    export default {
        props: ['height'],
        data() {
            return {
                chart: null,
                filter: null,
            }
        },
        created: function() {
            this.$parent.$on('update-countries', this.loadData);
        },
        mounted() {
            this.obj = Highcharts.mapChart(`chart-container-${this._uid}`, {
                chart: {
                    height: ( this.height - 42 ),
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
                axios.get(`/dashboard/countries?filter=${this.filter}`, ).then( (response) => {
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
            },
            changeFilter(value) {
                this.filter = value;
                this.loadData();
            }
        }
    }
</script>