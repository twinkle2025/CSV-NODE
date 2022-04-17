<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Finished Jobs</h5>
        </div>
        <table class="table datatable-ajax finished-jobs text-nowrap" :id="`data-table-${_uid}`">
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
    export default {
        mounted() {
            let table;
            table = jQuery(`#data-table-${this._uid}`).DataTable({
                ajax: `${window.location.origin}/api/v1/lists/completed`,
                processing: true,
                serverSide: true,
                order: [[ 0, "desc" ]],
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
                                case 'failed':
                                    badgeClass = 'danger';
                                    break;

                                case 'pending':
                                    badgeClass = 'warning';
                                    break;

                                default:
                                    badgeClass = 'success';
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
                            html += '       <a href="#" class="list-icons-item" data-toggle="dropdown">' + "\n";
                            html += '           <i class="icon-menu9"></i>' + "\n";
                            html += '       </a>' + "\n";
                            html += '       <div class="dropdown-menu dropdown-menu-right">' + "\n";
                            html += `           <a href="#/lists/processing/${row[0]}/restart" class="dropdown-item"><i class="icon-database-refresh"></i> Restart Job</a>` + "\n";
                            html += `           <a href="#/lists/uploaded/${row[9]}" class="dropdown-item"><i class="icon-gear"></i> Update Import Settings</a>` + "\n";
                            html += '       </div>' + "\n";
                            html += '   </div>' + "\n";
                            html += '</div>' + "\n";
                            return html;
                        }
                    }
                ],
            });
        }
    }
</script>