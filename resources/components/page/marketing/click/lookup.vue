<template>
    <div class="card">
        <div class="card-header">
            <h6 class="card-title">Lookup Click by ID</h6>
        </div>
        
        <div class="card-body" v-if="!loading">
            <div class="input-group mb-3" :id="`search-${this._uid}`">
                <div class="input-group-prepend">
                    <span class="input-group-text">Click ID:</span>
                </div>
                <input type="test" class="form-control" v-model="click_id" :id="`input-search-${this._uid}`">
                <div class="input-group-append">
                    <button class="btn btn-outline-success" type="button" :id="`button-search-${this._uid}`" @click="searchForClick()" ><i class="icon-search4"></i></button>
                </div>
            </div>
            <div class="alert alert-info" v-if="!has_searched">
                Use the form to search for a click
            </div>
            <div class="alert alert-warning" v-else-if="has_searched && null === click_info">
                Search returned no Results
            </div>
            <div class="table table-responsive text-nowrap" v-else>
                <table class="table table-bordered table-stripped table-hover table-xs">
                    <tbody>
                        <tr>
                            <th scope="row">Date/Time</th>
                            <td>{{click_info.created_at}}</td>
                        </tr>
                        <tr v-if="'object' === typeof(null !== click_info.email) && null !== click_info.email.value">
                            <th scope="row">Email</th>
                            <td>{{click_info.email.value}}</td>
                        </tr>
                        <tr v-if="'object' === typeof(null !== click_info.phone) && null !== click_info.phone.value">
                            <th scope="row">Phone</th>
                            <td>{{click_info.phone.value}}</td>
                        </tr>
                        <tr>
                            <th scope="row">Country</th>
                            <td>{{click_info.country.value}}</td>
                        </tr>
                        <tr>
                            <th scope="row">IP</th>
                            <td>{{click_info.ip.value}}</td>
                        </tr>
                        <tr>
                            <th scope="row">User Agent</th>
                            <td>{{click_info.ua.value}}</td>
                        </tr>
                        <tr>
                            <th scope="row">Click Meta Data</th>
                            <td><pre>{{click_info.meta}}</pre></td>
                        </tr>
                        <tr>
                            <th scope="row">Associated Lead</th>
                            <td v-if="click_info.lead_id"><a :href="window.location.href" @click="getLeadInformation()">{{click_info.lead_id}}</a></td>
                            <td v-else>No Associated Lead</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card-body" v-else>
            <div class="alert alert-info">
                Loading your search results. Please wait.
            </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" :id="`modal-${this._uid}`">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-dark">
                        <h5 class="modal-title">Lead Information</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <pre>{{JSON.stringify(lead, null, 2)}}</pre>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            click_id: null,
            click_info: null,
            has_searched: false,
            loading: false,
            lead: null,
            window,
        };
    },
    mounted() {
        jQuery(`#modal-${this._uid}`).modal({
            show: false,
        })
    },
    methods: {
        async searchForClick() {
            this.has_searched = true;
            this.loading = true;
            try {
                const {data} = await axios.post(`/marketing/clicks/lookup`, {
                    click_id: this.click_id,
                });
                this.click_info = data.body;
                this.loading = false;
            }
            catch (error) {
                handleAxiosError(error);
                this.loading = false;
            }
        },
        async getLeadInformation() {
            try {
                swal({
                    title: 'Loading Lead Information',
                    text: 'Please wait while the latest lead information is loaded',
                    type: 'info',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                });
                const {data} = await axios.get(`/leads/${this.click_info.lead_id}`);
                this.lead = data.body;
                swal.close();
                jQuery(`#modal-${this._uid}`).modal('show');
            }
            catch (error) {
                swal.close();
                handleAxiosError(error);
            }
        }
    },
    beforeDestroy() {
        jQuery(`#modal-${this._uid}`).modal('dispose');
    },
}
</script>

<style>

</style>
