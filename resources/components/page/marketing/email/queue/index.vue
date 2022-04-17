<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Email Queue</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <router-link class="btn btn-sm btn-success" to="/marketing/email/queue/enqueue">Enqueue</router-link>
        </div>
        <table class="table datatable-ajax text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Recipient Email</th>
                    <th>Recipient Name</th>
                    <th>Lead</th>
                    <th>Subject</th>
                    <th>Started</th>
                    <th>Account</th>
                    <th>Proxy</th>
                    <th>Proxy Failed</th>
                    <th>Account Failed</th>
                    <th>Spam Reject</th>
                    <th>Other Failure</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Recipient Email</th>
                    <th>Recipient Name</th>
                    <th>Lead</th>
                    <th>Subject</th>
                    <th>Started</th>
                    <th>Account</th>
                    <th>Proxy</th>
                    <th>Proxy Failed</th>
                    <th>Account Failed</th>
                    <th>Spam Reject</th>
                    <th>Other Failure</th>
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
                ajax: `${window.location.origin}/api/v1/marketing/email/queue/`,
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
                            return data;
                        }
                    },
                    {
                        name: 'status',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data.toUpperCase();
                        }
                    },
                    {
                        name: 'to_email',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data.toLowerCase();
                        }
                    },
                    {
                        name: 'to_name',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data;
                        }
                    },
                    {
                        name: 'lead_id',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data;
                        }
                    },
                    {
                        name: 'subject',
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return data;
                        }
                    },
                    {
                        name: 'started',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return `<div class="text-center"><span class="badge badge-success">Yes</span></div>`;
                            } else {
                                return `<div class="text-center"><span class="badge badge-danger">No</span></div>`;
                            }
                        }
                    },
                    {
                        name: 'account',
                        render: function(data, type, row, meta) {
                            if ('object' !== typeof(data) || null === data) {
                                return `<span class="badge badge-warning">No Account</span>`;
                            } else {
                                return `<a href="#/marketing/email/accounts/${data.id}">${data.email} via ${data.host}</a>`;
                            }
                        }
                    },
                    {
                        name: 'proxy',
                        render: function(data, type, row, meta) {
                            if ('object' !== typeof(data) || null === data) {
                                return `<span class="badge badge-warning">No Proxy</span>`;
                            } else {
                                return `<a href="#/marketing/email/proxies/${data.id}">${data.type}://${data.host}:${data.port}</a>`;
                            }
                        }
                    },
                    {
                        name: 'failed_proxy',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return `<div class="text-center"><span class="badge badge-success">Yes</span></div>`;
                            } else {
                                return `<div class="text-center"><span class="badge badge-danger">No</span></div>`;
                            }
                        }
                    },
                    {
                        name: 'failed_email_account',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return `<div class="text-center"><span class="badge badge-success">Yes</span></div>`;
                            } else {
                                return `<div class="text-center"><span class="badge badge-danger">No</span></div>`;
                            }
                        }
                    },
                    {
                        name: 'failed_spam',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return `<div class="text-center"><span class="badge badge-success">Yes</span></div>`;
                            } else {
                                return `<div class="text-center"><span class="badge badge-danger">No</span></div>`;
                            }
                        }
                    },
                    {
                        name: 'failed_other',
                        render: function(data, type, row, meta) {
                            if (true == data) {
                                return `<div class="text-center"><span class="badge badge-success">Yes</span></div>`;
                            } else {
                                return `<div class="text-center"><span class="badge badge-danger">No</span></div>`;
                            }
                        }
                    },
                ],
                columnDefs: [{
                    targets: 7,
                    orderable: false,
                },{
                    targets: 8,
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