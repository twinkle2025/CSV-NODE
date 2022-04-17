<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Processing Transfers</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <table class="table datatable-ajax processing-transfers text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Created At</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Created At</th>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script>
    import socket from '../../../js/socket.io';
    export default {
        data() {
            return {
                table: null,
            }
        },
        beforeDestroy() {
            socket.off('transfer');
        },
        mounted() {
            let table;
            socket.on('transfer', ({item}) => {
                const rows = this.table.rows();
                if (['new', 'failed'].indexOf(item.status) > -1) {
                    this.table.ajax.reload();
                }
                updateTableRow('table.processing-transfers', 0, item.id, {
                    "3": () => {
                        let badgeClass;
                        switch (item.status) {
                            case 'failed':
                                badgeClass = 'danger';
                                break;

                            case 'pending':
                                badgeClass = 'warning';
                                break;

                            case 'transfered':
                                badgeClass = 'success';
                                break;

                            default:
                                badgeClass = 'info';
                                break;
                        }
                        return `<span class="badge badge-${badgeClass} text-capitalize">${item.status}</span>`;
                    },
                    "4": () => {
                        return this.getReadableFileSizeString(item.imported_bytes);;
                    }
                });
            })
            const getReadableFileSizeString = this.getReadableFileSizeString;
            this.table = jQuery(`#data-table-${this._uid}`).DataTable({
                ajax: `${window.location.origin}/api/v1/transfer-from/jobs`,
                processing: true,
                serverSide: true,
                order: [[ 0, "desc" ]],
                columns:[
                    {
                        name: 'id',
                    },
                    {
                        name: 'service',
                        orderable: false,
                        render: function(data, type, row, meta) {
                            switch(data) {
                                case 'google':
                                    return 'Google Drive';

                                default:
                                    return data;
                            }
                        }
                    },
                    {
                        name: 'file_name',
                        orderable: false,
                        render: function(data, type, row, meta) {
                            return `<code>${data}</code>`;
                        }
                    },
                    {
                        name: 'status',
                        render: function(data, type, row, meta) {
                            let badgeClass;
                            switch (data) {
                                case 'failed':
                                    badgeClass = 'danger';
                                    break;

                                case 'pending':
                                    badgeClass = 'warning';
                                    break;

                                case 'transfered':
                                    badgeClass = 'success';
                                    break;

                                default:
                                    badgeClass = 'info';
                                    break;
                            }
                            return `<span class="badge badge-${badgeClass} text-capitalize">${data}</span>`;
                        }
                    },
                    {
                        name: 'imported_bytes',
                        render: function(data, type, row, meta) {
                            return getReadableFileSizeString(data);
                        }
                    },
                    {
                        name: 'created_at',
                        render: function(data, type, row, meta) {
                            return moment.utc(data).format('MMMM Do YYYY, h:mm:ss a');
                        }
                    },
                ],
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
            getReadableFileSizeString(fileSizeInBytes) {
                var i = -1;
                var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
                do {
                    fileSizeInBytes = fileSizeInBytes / 1024;
                    i++;
                } while (fileSizeInBytes > 1024);

                return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
            }
        }
    }
</script>