<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Email Blasts</h5>
            <div class="header-elements">
                <div class="list-icons">
                    <a class="list-icons-item" @click="refreshTable()" data-action="reload"></a>
                </div>
            </div>
        </div>
        <div class="card-body">
            <router-link class="btn btn-sm btn-success" to="/marketing/email/queue/enqueue">New</router-link>
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
                ajax: `${window.location.origin}/api/v1/marketing/email/blasts/`,
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
                            return `<a href="#/marketing/email/blasts/${row[0]}">${data}</a>`;
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
        }
    }
</script>