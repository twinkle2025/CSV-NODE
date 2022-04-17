<template>
    <div :class="contentClass">
        <div v-if="!loadedData || !loadedLayout" class="lds-ring"><div></div><div></div><div></div><div></div></div>
        <ajax-form v-else :action="this.url" method="PUT" @success="handleSuccess()" class="mb-3">
            <div class="table-responsive text-nowrap mb-3">
                <table class="table table-bordered table-stripped table-hover table-xs">
                    <thead>
                        <tr>
                            <th>Email Address</th>
                            <th>Sender Name</th>
                            <th>SMTP Host</th>
                            <th>SMTP Port</th>
                            <th>SMTP User</th>
                            <th>SMTP Password</th>
                            <th>Encryption</th>
                            <th>Hourly Cap</th>
                            <th>Daily Cap</th>
                            <th>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="p-0"><input type="email" class="form-control form-control-sm" v-model="account.email" name="email" /></td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="account.name" name="name" /></td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="account.host" name="host" /></td>
                            <td class="p-0"><input type="number" min="1" max="6500" class="form-control form-control-sm" v-model="account.port" name="port" /></td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="account.user" name="user" /></td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" v-model="account.password" name="password" /></td>
                            <td class="p-0">
                                <select class="form-control form-control-sm" v-model="account.encryption" name="encryption">
                                    <option value="none">None</option>
                                    <option value="ssl">SSL</option>
                                    <option value="tls">TLS</option>
                                </select>
                            </td>
                            <td class="p-0"><input type="number" min="-1" class="form-control form-control-sm" v-model="account.max_hourly" name="max_hourly" /></td>
                            <td class="p-0"><input type="number" min="-1" class="form-control form-control-sm" v-model="account.max_daily" name="max_daily" /></td>
                            <td class="p-0 text-center"><input type="checkbox" class="form-control form-control-sm" v-model="account.active" name="active" value="1" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="form-group">
                <label>Associate with Proxy</label>
                <searchable-select v-model="account.proxy_id" name="proxy_id" class="form-control" @change="$forceUpdate()" :key="proxiesLoadCount">
                    <option value="0">None</option>
                    <option v-if="'object' === typeof(account.proxy) && null !== account.proxy" :value="account.proxy.id">{{account.proxy.type}}://{{account.proxy.host}}:{{account.proxy.port}} ({{(account.proxy.active) ? 'Active' : 'Inactive'}})</option>
                    <option v-for="(proxy, index) in proxies" :key="index" :value="proxy.id">{{proxy.type}}://{{proxy.host}}:{{proxy.port}} ({{(proxy.active) ? 'Active' : 'Inactive'}})</option>
                </searchable-select>
                <button role="button" type="button" v-if="null !== account.proxy_id && account.proxy_id > 0" class="mt-1 btn btn-dark btn-sm" @click="navigateToProxy()">View Selected Proxy</button>
            </div>
            <button type="submit" class="btn btn-success">Save Changes</button>
        </ajax-form>
        <div v-if="loadedData && loadedLayout">
            <div v-if="'object' !== typeof(account.proxy) || null === account.proxy" class="alert alert-warning">
                You have not associated a proxy with this account. It will not be used until an account has been associated with it.
            </div>
        </div>
    </div>
</template>

<style>
.page-content:not(.container){
    padding-left: 15px;
    padding-right: 15px;
}

.full-height-content {
    height: calc(100vh - 192px - 2.5rem - 1.25rem);
}
</style>


<script>
    import socket from '../../../../../js/socket.io';
    export default {
        data() {
            return {
                loadedLayout: true,
                loadedData: false,
                account: null,
                url: null,
                proxies: [],
                proxiesLoadCount: 0,
            };
        },
        async mounted() {
            this.url = `/marketing/email/accounts/${this.$route.params.id}`;
            await this.loadAccountData();
            await this.loadAccounts();
            this.loadedData = true;
            socket.on('emailAccount', (data) => {
                if (data.id == this.account.id) {
                    this.loadAccountData();
                }
            });
            socket.on('proxy', (data) => {
                this.loadAccounts();
            });
        },
        computed: {
            contentClass() {
                if (!this.loadedLayout || !this.loadedData) {
                    return 'content d-flex justify-content-center align-items-center full-height-content';
                } else {
                    return 'container';
                }
            },
        },
        methods: {
            navigateToProxy() {
                if (this.account.proxy_id > 0) {
                    this.$router.push(`/marketing/email/proxies/${this.account.proxy_id}`)
                }
            },
            handleSuccess() {
                swal({
                    title: 'Success',
                    text: 'Account Updated Successfully',
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Fantastic!'
                });
                this.loadAccountData();
            },
            async loadAccountData() {
                try {
                    const {data} = await axios.get(this.url);
                    this.account = data.body;
                    if ('object' === typeof(this.account.proxy) && null !== this.account.proxy) {
                        this.account.proxy_id = this.account.proxy.id
                    } else {
                        this.account.proxy_id = 0
                    }
                    this.$nextTick(() => {
                        this.$forceUpdate();
                    });
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            async loadAccounts() {
                try {
                    const {data} = await axios.get('/marketing/email/proxies/all');
                    this.proxies = data.body;
                    this.$nextTick(() => {
                        this.$forceUpdate();
                    });
                } catch (error) {
                    handleAxiosError(error);
                }
            }
        },
        beforeDestroy() {
            socket.off('emailAccount');
            socket.off('proxy');
        },
    }
</script>