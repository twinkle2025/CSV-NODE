<template>
   <ajax-form class="card" :action="`/jobs/${$route.params.id}/${$route.params.jobType}`" method="POST" @success="handleStartSuccess()">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">{{job_type_capitalized}} Job<span v-if="file">&nbsp;<code>{{$route.params.id}}</code></span></h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="file">
                Are you sure that you want to {{job_type_lowercase}} job <code>{{$route.params.id}}</code>?
                <div class="form-group mt-1">
                    <button class="btn btn-success" role="submit" type="submit">Yes, {{job_type_lowercase}} import job</button>
                    <router-link to="/lists/processing" class="btn btn-secondary" exact>Nevermind</router-link>
                </div>
            </div>
        </div>
    </ajax-form>
</template>

<script>
    const titleCase = require('title-case');
    export default {
        data () {
            return {
                loading: false,
                file: null,
                error: null
            }
        },
        computed: {
            job_type_capitalized() {
                switch (this.$route.params.jobType) {
                    case 'stop':
                        return 'Pause';
                        
                    default:
                        return titleCase(this.$route.params.jobType);
                }
            },
            job_type_lowercase() {
                return this.job_type_capitalized.toLowerCase();
            },
            job_type_past_tense() {
                switch (this.$route.params.jobType) {
                    case 'resume':
                        return 'resumed';

                    case 'cancel':
                        return 'cancelled';

                    case 'stop':
                        return 'paused';

                    default:
                        return `${this.$route.params.jobType}ed`;
                }
            },
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
                const path = `/jobs/${this.$route.params.id}`;
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
                    title: `File Import Job ${titleCase(this.job_type_past_tense)}`,
                    text: `File import has been ${this.job_type_past_tense} for job ${this.file.id}.`,
                    type: 'success'
                });
                this.$router.push('/lists/processing');
            }
        }
    }
</script>