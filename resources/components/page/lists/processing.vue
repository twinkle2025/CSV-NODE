<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Processing Import Jobs</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <table class="table datatable-ajax processing-jobs text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Total Rows</th>
                    <th>Processed Rows</th>
                    <th>Valid Rows</th>
                    <th>Invalid Rows</th>
                    <th>Duplicated Rows</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Total Rows</th>
                    <th>Processed Rows</th>
                    <th>Valid Rows</th>
                    <th>Invalid Rows</th>
                    <th>Duplicated Rows</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script>
    import socket from '../../../js/socket.io';
    import Notification from '../../../js/notify';
    export default {
        data() {
            return {
                table: null,
            }
        },
        mounted() {
            let table;
            socket.on('job', ({job}) => {
                const rows = this.table.rows();
                if (['new', 'completed', 'failed', 'cancelled'].indexOf(job.status) > -1) {
                    this.table.ajax.reload();
                }
                updateTableRow('table.processing-jobs', 0, job.id, {
                    "2": () => {
                        let badgeClass;
                        switch (job.status) {
                            case 'new':
                                badgeClass = 'danger';
                                break;

                            case 'pending':
                                badgeClass = 'warning';
                                break;

                            default:
                                badgeClass = 'info';
                                break;
                        }
                        return `<span class="badge badge-${badgeClass} text-capitalize">${job.status}</span>`;
                    },
                    "3": job.total_rows,
                    "4": () => () => {
                        let html = '';
                        let percentage = 0;
                        if (job.total_rows > 0) {
                            percentage = job.processed_rows / job.total_rows
                        }
                        percentage = percentage * 100;
                        html += `<div class="progress mb-0">` + "\n";
                        html += `    <div class="progress-bar  " role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${job.processed_rows} (${parseFloat(percentage).toFixed(0)}%)</div>` + "\n";
                        html += `</div>` + "\n";
                        return html;
                    },
                    "5": job.valid_rows,
                    "6": job.invalid_rows,
                    "7": job.duplicate_rows,
                });
            })
            socket.on('connect', () => {
                this.table.ajax.reload();
            });
            socket.on('reconnect', () => {
                this.table.ajax.reload();
            });
            this.table = jQuery(`#data-table-${this._uid}`).DataTable({
                ajax: `${window.location.origin}/api/v1/lists/processing`,
                processing: true,
                serverSide: true,
                columns:[
                    {
                        name: 'id',
                    },
                    {
                        name: 'file_name',
                        orderable: false,
                        render: function(data, type, row, meta) {
                            data = $('<div>').text(data).html();
                            return `<code>${data}</code>`;
                        }
                    },
                    {
                        name: 'status',
                        render: function(data, type, row, meta) {
                            let badgeClass;
                            switch (data) {
                                case 'new':
                                    badgeClass = 'danger';
                                    break;

                                case 'pending':
                                    badgeClass = 'warning';
                                    break;

                                default:
                                    badgeClass = 'info';
                                    break;
                            }
                            return `<span class="badge badge-${badgeClass} text-capitalize">${data}</span>`;
                        }
                    },
                    {
                        name: 'total_rows',
                    },
                    {
                        name: 'processed_rows',
                        render: function(data, type, row, meta) {
                            let html = '';
                            let percentage = 0;
                            if (row[3] > 0) {
                                percentage = data / row[3]
                            }
                            percentage = percentage * 100;
                            html += `<div class="progress mb-0">` + "\n";
                            html += `    <div class="progress-bar  " role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${data} (${parseFloat(percentage).toFixed(0)}%)</div>` + "\n";
                            html += `</div>` + "\n";
                            return html;
                        }
                    },
                    {
                        name: 'valid_rows',
                    },
                    {
                        name: 'invalid_rows',
                    },
                    {
                        name: 'duplicate_rows',
                    },
                    {
                        name: 'created_at',
                        render: function(data, type, row, meta) {
                            return moment.utc(data).format('MMMM Do YYYY, h:mm:ss a');
                        }
                    },
                ],
                columnDefs: [
                    {
                        "targets": 9,
                        "render": function(data, type, row, meta) {
                            let html = '';
                            html += '<div class="list-icons">' + "\n";
                            html += '   <div class="dropdown">' + "\n";
                            if(row[2] !== 'cancelled') {
                            html += '       <a href="#" class="list-icons-item" data-toggle="dropdown">' + "\n";
                            html += '           <i class="icon-menu9"></i>' + "\n";
                            html += '       </a>' + "\n";
                                html += '       <div class="dropdown-menu dropdown-menu-right">' + "\n";
                                html += `           <a onclick="window.performImportAction(${row[0]}, 'restart')" oncontextmenu="window.open('#/lists/processing/${row[0]}/restart', '_blank')" class="dropdown-item"><i class="icon-database-refresh"></i> Restart Job</a>` + "\n";
                                html += `           <a onclick="window.performImportAction(${row[0]}, 'stop')" oncontextmenu="window.open('#/lists/processing/${row[0]}/stop', '_blank')" class="dropdown-item"><i class="text-warning icon-pause"></i> Pause Job</a>` + "\n";
                                html += `           <a onclick="window.performImportAction(${row[0]}, 'resume')" oncontextmenu="window.open('#/lists/processing/${row[0]}/resume', '_blank')" class="dropdown-item"><i class="text-info icon-play3"></i> Resume Job</a>` + "\n";
                                html += `           <a onclick="window.performImportAction(${row[0]}, 'cancel')" oncontextmenu="window.open('#/lists/processing/${row[0]}/cancel', '_blank')" class="dropdown-item"><i class="text-danger icon-minus-circle2"></i> Cancel Job</a>` + "\n";
                                html += '       </div>' + "\n";
                            }
                            html += '   </div>' + "\n";
                            html += '</div>' + "\n";
                            return html;
                        }
                    }
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
            }
        },
        beforeDestroy() {
            socket.off('job');
            socket.off('connect');
            socket.off('reconnect');
        },
    }
</script>