<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Unimported Uploaded Lists</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <button class="btn btn-sm btn-primary" @click="selectAllCheckboxed()" role="button" type="button">Select All</button>
            <button class="btn btn-sm btn-danger" @click="deleteSelectedFiles()" role="button" type="button">Delete All Selected</button>
            <!-- <button class="btn btn-sm btn-info" @click="setupSelectedFiles()" role="button" type="button">Setup Selected Files</button> -->
        </div>
        <table class="table datatable-ajax text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>File Name</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>File Name</th>
                    <th>Upload Date</th>
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
            this.table = jQuery(`#data-table-${this._uid}`).DataTable({
                //ajax: {url: 'api/v1/lists', dataSrc:""},
                ajax: `${window.location.origin}/api/v1/lists`,
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
                            return `<input type="checkbox" value="${data}" class="mr-2" /> ${data}`;
                        },
                        'checkboxes': {
                            'selectRow': true
                        }
                    },
                    {
                        name: 'name',
                        render: function(data, type, row, meta) {
                            return $('<div>').text(data).html();
                        },
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
                        "targets": 3,
                        "render": function(data, type, row, meta) {
                            console.log();
                            let html = '';
                            html += '<div class="list-icons">' + "\n";
                            html += '   <div class="dropdown">' + "\n";
                            html += '       <a href="#" class="list-icons-item" data-toggle="dropdown">' + "\n";
                            html += '           <i class="icon-menu9"></i>' + "\n";
                            html += '       </a>' + "\n";
                            html += '       <div class="dropdown-menu dropdown-menu-right">' + "\n";
                            html += `           <a href="#/lists/uploaded/${row[0]}" class="dropdown-item"><i class="icon-gear"></i> Setup Import Settings</a>` + "\n";
                            if (true === row[3]) {
                            html += `           <a href="#/lists/uploaded/${row[0]}/start" class="dropdown-item"><i class="material-icons">play_arrow</i> Start Import Job</a>` + "\n";
                            }
                            html += `           <a href="#/lists/uploaded/${row[0]}/delete" class="dropdown-item"><i class="icon-trash"></i> Delete File</a>` + "\n";
                            html += '       </div>' + "\n";
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
            socket.on('file-upload-complete', (fileInfo) => {
                this.table.ajax.reload();
            });
        },
        beforeDestroy() {
            socket.off('file-upload-complete');
        },
        methods: {
            refreshTable() {
                this.table.ajax.reload();
            },
            selectAllCheckboxed() {
                jQuery('.datatable-scroll').find('input[type="checkbox"]').prop('checked', true);
            },
            async setupSelectedFiles() {
                const fileIds = [];
                jQuery('.datatable-scroll').find('input[type="checkbox"]:checked').each(function() {
                    fileIds.push(jQuery(this).val());
                });
                if (fileIds.length < 1) {
                    return;
                }
                await swal({
                    title: 'Confirmation',
                    text: `Are you sure that you want to setup ${fileIds.length} files? This should only be done on files which follow the same layout template.`,
                    type: 'warning',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-success',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: `Setup ${fileIds.length} Files`
                }).then(async (result) => {
                    if (result.value) {
                        this.$router.push({
                            path: '/lists/uploaded/bulk-setup',
                            query: {
                                files: fileIds,
                            },
                        })
                    }
                })
            },
            async deleteSelectedFiles() {
                const fileIds = [];
                jQuery('.datatable-scroll').find('input[type="checkbox"]:checked').each(function() {
                    fileIds.push(jQuery(this).val());
                });
                if (fileIds.length < 1) {
                    return;
                }
                await swal({
                    title: 'Confirmation',
                    text: `Are you sure that you want to delete ${fileIds.length} files? This action cannot be undone! Once a file is deleted it must be re-uploaded. All settings and jobs related to this file will be unrecoverable.`,
                    type: 'warning',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-danger',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: `Delete ${fileIds.length} Files`
                }).then(async (result) => {
                    if (result.value) {
                        swal({
                            title: 'Processing',
                            text: 'Please wait while the files are deleted',
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
                        for (let i = 0; i < fileIds.length; i++) {
                            const fileId = fileIds[i];
                            const path = `/lists/${fileId}`;
                            try {
                                const repsonse = await axios.delete(path);
                                PNotify.success({
                                    title: 'File Deleted',
                                    text: `File ${fileId} has been deleted successfully.`,
                                    type: 'success'
                                });
                            } catch (error) {
                                handleAxiosError(error);
                            }

                        }
                        swal.close();
                        this.refreshTable();
                    }
                })
            }
        }
    }
</script>