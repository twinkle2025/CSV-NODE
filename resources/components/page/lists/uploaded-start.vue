<template>
   <ajax-form class="card" :action="`/lists/${$route.params.id}/start`" method="POST" @success="handleStartSuccess()">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Start Import<span v-if="file">&nbsp;of <code>{{file.name}}</code></span></h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="file">
                Are you sure that you want to start importing <code>{{file.name}}</code>?
                <div class="form-group mt-1">
                    <button class="btn btn-success" role="submit" type="submit">Yes, start import job</button>
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
            handleStartSuccess () {
                PNotify.success({
                    title: 'File Import Job Started',
                    text: `File import has started for file ${this.file.name}.`,
                    type: 'success'
                });
                this.$router.push('/lists/processing');
            }
        }
    }
</script>