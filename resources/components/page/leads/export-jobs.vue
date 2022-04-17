<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Processing Export Jobs</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <table class="table datatable-ajax export-jobs text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Total Rows</th>
                    <th>Processed Rows</th>
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
                    <th>Created At</th>
                    <th>Actions</th>
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
        mounted() {
            socket.on('export-job', ({job}) => {
                const rows = this.table.rows();
                for (let i = 0; i < rows[0].length; i++) {
                    const rowId = rows[0][i];
                    const row = this.table.row(rowId);
                    const data = row.data();
                    if (['new',  'ready for download', 'failed to save file'].indexOf(job.status) > -1) {
                        this.table.ajax.reload();
                    }
                    updateTableRow('table.export-jobs', 0, job.id, {
                        "2": () => {
                            let badgeClass;
                            switch (job.status) {
                                case 'new':
                                    badgeClass = 'danger';
                                    break;

                                case 'starting':
                                    badgeClass = 'warning';
                                    break;

                                case 'ready for download':
                                    badgeClass = 'success';
                                    break;

                                case 'completed':
                                    badgeClass = 'primary';
                                    break;

                                case 'failed to save file':
                                    badgeClass = 'danger';
                                    break;

                                case 'failed':
                                    badgeClass = 'danger';
                                    break;

                                case 'stuck':
                                    badgeClass = 'warning';
                                    break;

                                default:
                                    badgeClass = 'info';
                                    break;
                            }
                            return `<span class="badge badge-${badgeClass} text-capitalize">${job.status}</span>`;
                        },
                        "3": job.total_rows,
                        "4": () => {
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
                        }
                    });
                }
            })
            socket.on('connect', () => {
                this.table.ajax.reload();
            });
            socket.on('reconnect', () => {
                this.table.ajax.reload();
            });
            this.table = jQuery(`#data-table-${this._uid}`).DataTable({
                ajax: `${window.location.origin}/api/v1/leads/exports`,
                processing: true,
                serverSide: true,
                order: [[ 0, "desc" ]],
                columns:[
                    {
                        name: 'id',
                    },
                    {
                        name: 'export_name',
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

                                case 'starting':
                                    badgeClass = 'warning';
                                    break;

                                case 'ready for download':
                                    badgeClass = 'success';
                                    break;

                                case 'completed':
                                    badgeClass = 'primary';
                                    break;

                                case 'failed to save file':
                                    badgeClass = 'danger';
                                    break;

                                case 'failed':
                                    badgeClass = 'danger';
                                    break;

                                case 'stuck':
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
                        name: 'created_at',
                        render: function(data, type, row, meta) {
                            return moment.utc(data).format('MMMM Do YYYY, h:mm:ss a');
                        }
                    },
                ],
                columnDefs: [
                    {
                        "targets": 6,
                        "render": function(data, type, row, meta) {
                            let html = '';
                            html += '<div class="list-icons">' + "\n";
                            html += '   <div class="dropdown">' + "\n";
                            html += '       <a href="#" class="list-icons-item" data-toggle="dropdown">' + "\n";
                            html += '           <i class="icon-menu9"></i>' + "\n";
                            html += '       </a>' + "\n";
                            html += '       <div class="dropdown-menu dropdown-menu-right">' + "\n";
                            html += `           <a onclick="window.restartExport(${row[0]})" class="dropdown-item"><i class="icon-database-refresh"></i> Restart Job</a>` + "\n";
                            if ('ready for download' === row[2]) {
                            html += `           <a href="/exports/${row[0]}" target="_blank" class="dropdown-item"><i class="icon-file-download"></i> Download File</a>` + "\n";
                            }
                            html += '       </div>' + "\n";
                            html += '   </div>' + "\n";
                            html += '</div>' + "\n";
                            return html;
                        }
                    }
                ],
            });
        },
        methods: {
            refreshTable() {
                this.table.ajax.reload();
            }
        },
        beforeDestroy() {
            socket.off('export-job')
            socket.off('connect');
            socket.off('reconnect');
        }
    }
</script>