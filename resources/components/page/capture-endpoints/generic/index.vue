<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Generic Capture Endpoints</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <router-link class="btn btn-sm btn-success" to="/capture/endpoints/generic/new">New</router-link>
        </div>
        <table class="table datatable-ajax text-nowrap" :id="`data-table-${_uid}`">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>URL</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>URL</th>
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
                ajax: `${window.location.origin}/api/v1/capture-endpoints/?type=generic`,
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
                            return `<a href="#/capture/endpoints/generic/${row[0]}">${data}</a>`;
                        }
                    },
                    {
                        name: 'url',
                        render: function(data, type, row, meta) {
                            return `<input type="form-control form-control-sm" style="min-width: 100%" readonly value="${window.location.origin}/capture/generic/${data}" />`;
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
        }
    }
</script>