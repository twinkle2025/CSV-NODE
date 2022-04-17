<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Proxies</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <router-link class="btn btn-sm btn-success" to="/marketing/email/proxies/new">New</router-link>
        </div>
        <table class="table datatable-ajax text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Active</th>
                    <th>Type</th>
                    <th>Host</th>
                    <th>Port</th>
                    <th>Account</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>Active</th>
                    <th>Type</th>
                    <th>Host</th>
                    <th>Port</th>
                    <th>Account</th>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                table: null,
            }
        },
        mounted() {
            this.table = jQuery(`#data-table-${this._uid}`).DataTable({
                //ajax: {url: 'api/v1/lists', dataSrc:""},
                ajax: `${window.location.origin}/api/v1/marketing/email/proxies/`,
                processing: true,
                serverSide: true,
                order: [[ 0, "desc" ]],
                select: {
                    style: 'multi',
                    selector: 'td:first-child'
                },
                buttons: [
                    'selectAll',
                    'selectNone'
                ],
                columns:[
                    {
                        name: 'id',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return `<a href="#/marketing/email/proxies/${row[0]}">${data}</a>`;
                        }
                    },
                    {
                        name: 'active',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return '<span class="badge badge-success">Yes</span>';
                            } else {
                                return '<span class="badge badge-danger">No</span>';
                            }
                        }
                    },
                    {
                        name: 'type',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data;
                        }
                    },
                    {
                        name: 'host',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return `<a href="#/marketing/email/proxies/${row[0]}">${data}</a>`;
                        }
                    },
                    {
                        name: 'port',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return `<code>${data}</code>`;
                        }
                    },
                    {
                        name: 'account',
                        render: function(data, type, row, meta) {
                            console.log(data);
                            if ('object' !== typeof(data) || null === data) {
                                return `<span class="badge badge-warning">No Account</span>`;
                            } else {
                                return `<a href="#/marketing/email/accounts/${data.id}">${data.email} via ${data.host}</a>`;
                            }
                        }
                    },
                ],
                columnDefs: [{
                    targets: 5,
                    orderable: false,
                }]
            });
            this.table.on('preXhr.dt', (e) => {
                this.$Progress.start();
            });
            this.table.on('xhr.dt', (e) => {
                this.$Progress.finish();
            });
        },
        methods: {
            refreshTable() {
                this.table.ajax.reload();
            },
            selectAllCheckboxed() {
                jQuery('.datatable-scroll').find('input[type="checkbox"]').prop('checked', true);
            },
        }
    }
</script>