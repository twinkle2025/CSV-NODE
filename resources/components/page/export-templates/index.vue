<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Export Templates</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <router-link class="btn btn-sm btn-success" to="/export/templates/new">New</router-link>
        </div>
        <table class="table datatable-ajax text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
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
                ajax: `${window.location.origin}/api/v1/export-templates/`,
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
                            data = $('<div>').text(data).html();
                            return `<a href="#/export/templates/${row[0]}">${data}</a>`;
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
            },
            selectAllCheckboxed() {
                jQuery('.datatable-scroll').find('input[type="checkbox"]').prop('checked', true);
            },
            async deleteSelectedFiles() {
                const templateIds = [];
                jQuery('.datatable-scroll').find('input[type="checkbox"]:checked').each(function() {
                    templateIds.push(jQuery(this).val());
                });
                if (templateIds.length < 1) {
                    return;
                }
                await swal({
                    title: 'Confirmation',
                    text: `Are you sure that you want to delete ${templateIds.length} templates? This action cannot be undone!`,
                    type: 'warning',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-danger',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: `Delete ${templateIds.length} Templates`
                }).then(async (result) => {
                    if (result.value) {
                        swal({
                            title: 'Processing',
                            text: 'Please wait while the templates are deleted',
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
                        for (let i = 0; i < templateIds.length; i++) {
                            const templateId = templateIds[i];
                            const path = `/export-templates/${templateId}`;
                            try {
                                const repsonse = await axios.delete(path);
                                PNotify.success({
                                    title: 'Template Deleted',
                                    text: `Template ${templateId} has been deleted successfully.`,
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