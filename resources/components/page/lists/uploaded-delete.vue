<template>
   <ajax-form class="card" :action="`/lists/${$route.params.id}`" method="DELETE" @success="handleDeleteSuccess()">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Delete Uploaded File</h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="file">
                Are you sure that you want to delete <code>{{file.name}}</code>?
                <div class="alert alert-danger mt-1">This action cannot be undone! Once a file is deleted it must be re-uploaded. All settings and jobs related to this file will be unrecoverable.</div>
                <div class="form-group">
                    <button class="btn btn-danger" role="submit" type="submit">Yes, delete the file</button>
                    <router-link to="/lists/uploaded" class="btn btn-secondary" exact>Nevermind</router-link>
                </div>
            </div>
        </div>
    </ajax-form>
</template>

<script>
    export default {
        data () {
            return {
                loading: false,
                file: null,
                error: null
            }
        },
        created () {
            this.fetchData()
        },
        watch: {
            '$route': 'fetchData'
        },
        methods: {
            fetchData () {
                this.error = this.file = null
                this.loading = true
                const path = `/lists/${this.$route.params.id}`;
                axios.get(path).then( (response) => {
                    this.loading = false;
                    this.file = response.data.body;
                })
                .catch( (error) => {
                    this.loading = false;
                    this.error = 'Unable to load page';
                    handleAxiosError(error);
                });
            },
            handleDeleteSuccess () {
                PNotify.success({
                    title: 'File Deleted',
                    text: `File ${this.file.name} has been deleted successfully.`,
                    type: 'success'
                });
                this.$router.push('/lists/uploaded');
            }
        }
    }
</script>