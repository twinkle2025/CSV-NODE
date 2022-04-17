<template>
    <section>
        <div class="card">
            <div class="card-header header-elements-inline">
                <h5 class="card-title">Supressed Emails</h5>
                <div class="header-elements">
                    <div class="list-icons">
                        <a :href="window.location.href" @click="getList()" class="cursor-pointer list-icons-item icon-sync" title="Refresh List"></a>
                        <a :href="window.location.href" @click="refreshList()" class="cursor-pointer list-icons-item icon-database-refresh" title="Reload Supression List from Database"></a>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <editor v-if="loaded && !error" v-model="results" @init="editorInit" lang="text" theme="chrome" width="100%" height="500px"></editor>
                <div class="alert alert-info text-center m-0" v-if="!loaded && !error">Loading Supression List. Please wait.</div>
                <div class="alert alert-danger text-center m-0" v-if="error">An error occured while loading the supression list. Please try again.</div>
            </div>
        </div>
    </section>
</template>

<script>
    import socket from '../../../../../js/socket.io';
    export default {
        data() {
            return {
                loaded: false,
                error: false,
                window,
                results: '',
                list: 'email',
            }
        },
        mounted() {
            socket.on(`${this.list}s-supression-list-reloading`, () => {
                swal({
                    title: 'Generating Suppression List',
                    text: 'The Supression List is being Refreshed. Once complete, this window will close and the updated supression list will be shown.',
                    type: 'success',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    allowEnterKey: false,
                });
            });
            socket.on(`${this.list}s-supression-list-reloaded`, () => {
                this.getList();
                swal.close();
            });
            this.getList();
        },
        beforeDestroy() {
            socket.off(`${this.list}s-supression-list-reloading`);
            socket.off(`${this.list}s-supression-list-reloaded`);
        },
        methods: {
            editorInit: function (editor) {
                require('brace/ext/language_tools')
                require('brace/mode/text')                
                require('brace/theme/chrome')
                editor.setReadOnly(true);
                editor.setShowPrintMargin(false);
            },
            async getList() {
                this.loaded = false;
                const uri = `/email/supressed/${this.list}s`
                try {
                    const {data} = await axios.get(uri);
                    this.results = '';
                    data.body.forEach((value) => {
                        this.results += value + "\n";
                    });
                    this.results = this.results.trim();
                    this.loaded = true;
                } catch (error) {
                    this.error = true;
                    handleAxiosError(error);
                }
            },
            async refreshList() {
                const uri = `/email/supressed/populate/${this.list}s`
                try {
                    const {data} = await axios.post(uri);
                } catch (error) {
                    handleAxiosError(error);
                }
            }
        },
        components: {
            editor: require('vue2-ace-editor'),
        }
    }
</script>