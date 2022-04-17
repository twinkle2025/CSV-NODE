<template>
    <section>
        <div class="card">
            <div class="card-header header-elements-inline">
                <h5 class="card-title">Review Clicks</h5>
                <div class="header-elements" v-if="!error && loaded">
                    Showing {{Object.keys(clicks).length}} of {{total}}
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive mb-0 text-nowrap">
                    <table class="table table-hover table-sm table-bordered mb-0" :id="`review_table_${_uid}`">
                        <thead>
                            <tr>
                                <th class="text-center" width="50" style="width: 50px">
                                    <input type="checkbox" v-model="checkAllBoxes" @click="checkAllOfTheBoxes()" />
                                </th>
                                <th class="p-1">
                                    <div class="btn-group btn-group-sm m-0" role="group">
                                        <button style="cursor: pointer" type="button" class="btn btn-outline-success" title="Approve all Selected Clicks" @click="approveAllSelectedClicks()"><i class="icon-checkmark4"></i></button>
                                        <button style="cursor: pointer" type="button" class="btn btn-outline-info" title="Refresh List" @click="getOriginalResults()"><i class="fas fa-sync"></i></button>
                                    </div>
                                </th>
                                <th>Country</th>
                                <th><button @click="supressAllSelected('email')" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-warning" title="Supress all Selected Email Addresses"><i class="icon-user-block"></i></button>Email Address</th>
                                <th><button @click="supressAllSelected('domain')" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-danger" title="Supress all Selected Domains"><i class="fas fa-at"></i></button>Email Domain</th>
                                <th><button @click="supressAllSelected('ip')" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-danger" title="Supress all Selected IP Addresses"><i class="fas fa-network-wired"></i></button>IP Address</th>
                                <th><button @click="supressAllSelected('ua')" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-warning" title="Supress all Selected User Agents"><i class="icon-browser"></i></button>User Agent</th>
                            </tr>
                        </thead>
                        <tbody v-if="error">
                            <tr>
                                <td colspan="7">
                                    <div class="alert alert-danger text-center p-1 m-0">An error occured loading the results. <a :href="window.location.href" class="text-white" @click="getOriginalResults()">Click here to retry.</a></div>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else-if="!loaded">
                            <tr>
                                <td colspan="7">
                                    <div class="alert alert-info text-center p-1 m-0">Loading. Please wait</div>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else-if="loaded && 0 === Object.keys(clicks).length">
                            <tr>
                                <td colspan="7">
                                    <div class="alert alert-success text-center p-1 m-0">No clicks to review</div>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else>
                            <tr v-for="(click, id, index) in clicks" :key="index">
                                <td>
                                    <input type="checkbox" :value="id" />
                                </td>
                                <td class="p-1 text-center" style="width: 249px">
                                    <div class="btn-group btn-group-sm m-0" role="group">
                                        <button style="cursor: pointer" type="button" class="btn btn-outline-success" title="Approve Click" @click="approveClick(id)"><i class="icon-checkmark4"></i></button>
                                    </div>
                                </td>
                                <td>
                                    <i :class="(click.country.supressed ? 'text-danger icon-spam mr-2' : 'text-success icon-checkmark4 mr-2')" :title="click.country.reason"></i>
                                    {{getName(click.country.value)}} ({{click.country.value}})
                                </td>
                                <td>
                                    <button v-if="!click.email.supressed" @click="supress('email', click.email.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-warning" title="Supress Email Address"><i class="icon-user-block"></i></button>
                                    <button v-else @click="unsupress('email', click.email.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-success" title="Unsupress Email Address"><i class="icon-user-block"></i></button>
                                    <i :class="(click.email.supressed ? 'text-danger icon-spam mr-2' : 'text-success icon-checkmark4 mr-2')" :title="click.email.reason"></i>
                                    {{click.email.value}}
                                </td>
                                <td>
                                    <button v-if="!click.domain.supressed" @click="supress('domain', click.domain.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-danger" title="Supress Domain"><i class="fas fa-at"></i></button>
                                    <button v-else @click="unsupress('domain', click.domain.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-success" title="Unsupress Domain"><i class="fas fa-at"></i></button>
                                    <i :class="(click.domain.supressed ? 'text-danger icon-spam mr-2' : 'text-success icon-checkmark4 mr-2')" :title="click.domain.reason"></i>
                                    {{click.domain.value}}
                                </td>
                                <td>
                                    <button v-if="!click.ip.supressed" @click="supress('ip', click.ip.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-danger" title="Supress IP Address"><i class="fas fa-network-wired"></i></button>
                                    <button v-else @click="unsupress('ip', click.ip.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-success" title="Unsupress IP Address"><i class="fas fa-network-wired"></i></button>
                                    <i :class="(click.ip.supressed ? 'text-danger icon-spam mr-2' : 'text-success icon-checkmark4 mr-2')" :title="click.ip.reason"></i>
                                    {{click.ip.value}}
                                </td>
                                <td>
                                    <button v-if="!click.ua.supressed" @click="supress('ua', click.ua.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-warning" title="Supress User Agent"><i class="icon-browser"></i></button>
                                    <button v-else @click="unsupress('ua', click.ua.value)" style="cursor: pointer" type="button" class="mr-2 btn btn-sm btn-outline-success" title="Unsupress User Agent"><i class="icon-browser"></i></button>
                                    <i :class="(click.ua.supressed ? 'text-danger icon-spam mr-2' : 'text-success icon-checkmark4 mr-2')" :title="click.ua.reason"></i>
                                    {{click.ua.value}}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot v-if="loaded && !error && scroll && Object.keys(clicks).length < total">
                            <tr>
                                <th colspan="7" class="text-center"><a :href="window.location.href" @click="getScrollResults()">Load more results</a></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    const { getName } = require('country-list');
    export default {
        data() {
            return {
                loaded: false,
                error: false,
                clicks: {},
                checkAllBoxes: false,
                scroll: null,
                total: 0,
                window,
            }
        },
        mounted() {
            this.getOriginalResults();
        },
        methods: {
            supressAllSelected(key) {
                const checkboxes = jQuery(`#review_table_${this._uid} > tbody input[type="checkbox"]:checked`);
                for (let i = 0; i < checkboxes.length; i++) {
                    const checkbox = checkboxes[i];
                    const cb = jQuery(checkbox);
                    const id = cb.val();
                    const val = this.clicks[id][key].value;
                    this.supress(key, val);
                }
            },
            supress(key, value) {
                for (let id in this.clicks) {
                    const click = this.clicks[id];
                    const val = click[key].value;
                    if (value == val) {
                        this.clicks[id][key].supressed = true;
                        this.clicks[id][key].reason = 'Manually Reviewed';
                        this.saveClick(id);
                    }
                }
            },
            unsupress(key, value) {
                for (let id in this.clicks) {
                    const click = this.clicks[id];
                    const val = click[key].value;
                    if (value == val) {
                        this.clicks[id][key].supressed = false;
                        this.clicks[id][key].reason = null;
                        this.saveClick(id);
                    }
                }
            },
            approveClick(id) {
                this.clicks[id].reviewed = true;
                this.saveClick(id);
            },
            approveAllSelectedClicks() {
                const checkboxes = jQuery(`#review_table_${this._uid} > tbody input[type="checkbox"]:checked`);
                for (let i = 0; i < checkboxes.length; i++) {
                    const checkbox = checkboxes[i];
                    const cb = jQuery(checkbox);
                    const id = cb.val();
                    this.approveClick(id);
                }
            },
            async saveClick(id) {
                try {
                    const {data} = await axios.put(`/email/supressed/review/click/${id}`, this.clicks[id]);
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            getName,
            checkAllOfTheBoxes() {
                this.$nextTick(function() {
                    jQuery(`#review_table_${this._uid} > tbody input[type="checkbox"]`).prop('checked', !this.checkAllBoxes);
                });
            },
            async getOriginalResults() {
                this.loaded = false;
                this.clicks = {};
                this.scroll = null;
                this.total = 0;
                try {
                    const {data} = await axios.get('/email/supressed/review');
                    this.error = false;
                    this.loaded = true;
                    this.clicks = data.body.clicks;
                    this.scroll = data.body.scroll;
                    this.total = data.body.total;
                } catch (error) {
                    this.error = true;
                    handleAxiosError(error);
                }
            },
            async getScrollResults() {
                if (!this.scroll) {
                    // show an error
                    return;
                }
                try {
                    const {data} = await axios.get(`/email/supressed/review/${this.scroll}`);
                    this.scroll = data.body.scroll;
                    this.clicks = {...this.clicks, ...data.body.clicks};
                } catch (error) {
                    handleAxiosError(error);
                }
            }
        }
    }
</script>