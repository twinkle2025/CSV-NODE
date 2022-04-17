<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">{{title}}</h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading && !error">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label>SMS Provider Name</label>
                <input type="text" v-model="name" class="form-control form-control-lg" />
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label>SMS Provider Provider</label>
                <searchable-select class="form-control form-control-lg" v-model="provider">
                    <option v-for="(info, provider, index) in providers" :key="index" :value="provider">{{info.name}}</option>
                </searchable-select>
            </div>
            <div v-if="!loading && !error" class="row">
                <div class="col-12 form-group" v-for="(type, key, index) in configuration" :key="index">
                    <label><code>{{key}}</code></label>
                    <input :type="providers[provider].config[key]" v-model="configuration[key]" class="form-control form-control-lg" />
                </div>
            </div>
            <div v-if="!loading && !error" class="text-right">
                <button role="button" class="btn btn-primary mb-3" type="button" @click="submitForm()">Save</button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                title: 'SMS Provider',
                name: null,
                loading: true,
                error: null,
                providers: {},
                provider: null,
                configuration: {
                },
            }
        },
        async mounted() {
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create an SMS Provider' : `Edit SMS Provider #${this.$route.params.id}`;
            if ('undefined' !== typeof(this.$route.params.id)) {
                await new Promise( async (resolve) => {
                    await this.loadApiProviders();
                    await this.loadApiInformation();
                    this.loading = false;
                    resolve();
                })
            } else {
                await this.loadApiProviders();
                this.$nextTick(() => {
                    this.loading = false;
                });
            }
            
        },
        methods: {
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the SMS Provider. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? 'marketing/sms/providers/' : `marketing/sms/providers/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            service: this.provider,
                            configuration: this.configuration,
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved SMS Provider Successfully.',
                        type: 'success',
                        buttonsStyling: false,
                        confirmButtonClass: 'btn btn-success',
                        cancelButtonClass: 'btn btn-light',
                        showCancelButton: false,
                        showConfirmButton: true,
                        allowOutsideClick: true,
                        allowEscapeKey: true,
                        allowEnterKey: true,
                    });
                    if ('undefined' === typeof(this.$route.params.id)) {
                        this.$router.push(`/marketing/sms/providers/${response.data.body.id}`);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadApiInformation() {
                this.loading = true;
                const path = `marketing/sms/providers/${this.$route.params.id}`;
                try {
                    const response = await axios.get(path);
                    this.name = response.data.body.name;
                    this.provider = response.data.body.service;
                    this.$nextTick( () => {
                        this.configuration = Object.assign({}, this.configuration, response.data.body.configuration);
                    })
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load provider information';
                }
            },
            async loadApiProviders() {
                const path = `marketing/sms/providers/providers`;
                try {
                    const response = await axios.get(path);
                    this.providers = response.data.body;
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load provider information';
                }
            },
        },
        watch: {
            provider(newVal, oldVal) {
                const provider = this.providers[newVal];
                if ('undefined' !== typeof(provider)) {
                    const keys = Object.keys(provider.config);
                    const defaultConfig = {};
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        defaultConfig[key] = null;
                    }
                    this.configuration = Object.assign({}, defaultConfig, this.configuration);
                    for (let key in this.configuration) {
                        if ('undefined' === typeof(provider.config[key])) {
                            delete this.configuration[key];
                        }
                    }
                } else {
                    this.configuration = {};
                }
            }
        }
    }
</script>