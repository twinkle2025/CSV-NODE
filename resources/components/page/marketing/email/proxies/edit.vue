<template>
    <div :class="contentClass">
        <div v-if="!loadedData || !loadedLayout" class="lds-ring"><div></div><div></div><div></div><div></div></div>
        <ajax-form v-else :action="this.url" method="PUT" @success="handleSuccess()" class="mb-3">
            <div class="table-responsive text-nowrap mb-3">
                <table class="table table-bordered table-stripped table-hover table-xs">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Host</th>
                            <th>Port</th>
                            <th>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="p-0">
                                <select class="form-control form-control-sm" name="type" v-model="proxy.type">
                                    <option value="http">HTTP</option>
                                    <option value="socks4">SOCKS4</option>
                                    <option value="socks5">SOCKS5</option>
                                </select>
                            </td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" name="host" v-model="proxy.host" /></td>
                            <td class="p-0"><input type="text" class="form-control form-control-sm" name="port" v-model="proxy.port" /></td>
                            <td class="p-0 text-center"><input type="checkbox" class="form-control form-control-sm" name="active" v-model="proxy.active" value="1" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="form-group">
                <label>Associate with Email Account</label>
                <searchable-select v-model="proxy.account_id" name="account_id" class="form-control" @change="$forceUpdate()">
                    <option value="0">None</option>
                    <option v-if="'object' === typeof(proxy.account) && null !== proxy.account" :value="proxy.account.id">{{proxy.account.email}} via {{proxy.account.host}}:{{proxy.account.port}} ({{(proxy.account.active) ? 'Active' : 'Inactive'}})</option>
                    <option v-for="(account, index) in accounts" :key="index" :value="account.id">{{account.email}} via {{account.host}}:{{account.port}} ({{(account.active) ? 'Active' : 'Inactive'}})</option>
                </searchable-select>
                <button role="button" type="button" v-if="null !== proxy.account_id && proxy.account_id > 0" class="mt-1 btn btn-dark btn-sm" @click="navigateToAccount()">View Selected Account</button>
            </div>
            <button type="submit" class="btn btn-success">Save Changes</button>
        </ajax-form>
        <div v-if="loadedData && loadedLayout">
            <div v-if="'object' !== typeof(proxy.account) || null === proxy.account" class="alert alert-warning">
                You have not associated an account with this proxy. It will not be used until an account has been associated with it.
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
                proxy: null,
                url: null,
                accounts: [],
            };
        },
        async mounted() {
            this.url = `/marketing/email/proxies/${this.$route.params.id}`;
            await this.loadProxyData();
            await this.loadAccounts();
            this.loadedData = true;
            socket.on('emailAccount', (data) => {
                this.loadAccounts();
            });
            socket.on('proxy', (data) => {
                if (data.id == this.proxy.id) {
                    this.loadProxyData();
                }
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
            navigateToAccount() {
                if (this.proxy.account_id > 0) {
                    this.$router.push(`/marketing/email/accounts/${this.proxy.account_id}`)
                }
            },
            handleSuccess() {
                swal({
                    title: 'Success',
                    text: 'Proxy Updated Successfully',
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: true,
                    confirmButtonText: 'Fantastic!'
                });
            },
            async loadProxyData() {
                try {
                    const {data} = await axios.get(this.url);
                    this.proxy = data.body;
                    if ('object' === typeof(this.proxy.account) && null !== this.proxy.account) {
                        this.proxy.account_id = this.proxy.account.id
                    } else {
                        this.proxy.account_id = 0
                    }
                    this.$forceUpdate();
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            async loadAccounts() {
                try {
                    const {data} = await axios.get('/marketing/email/accounts/all');
                    this.accounts = data.body;
                    this.$forceUpdate();
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