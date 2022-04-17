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
            <div v-if="!loading && !error && hash" class="alert alert-info">
                <label>Endpoint URL</label>
                <input type="url" class="form-control" readonly :value="`${window.location.origin}/capture/generic/${hash}`"  />
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label>Endpoint Name</label>
                <input type="text" v-model="name" class="form-control form-control-lg" />
            </div>
            <div v-if="!loading && !error">
                <label>Field Mapping</label>
            </div>
            <div v-if="!loading && !error" class="table-responsive text-nowrap mb-3">
                <table class="table table-hover table-sm table-bordered mb-0">
                    <thead>
                        <tr>
                            <th>Request Field</th>
                            <th>Lead Field</th>
                            <th>Lead Field Type</th>
                            <th>Default</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(info, key, index) in mapping" :key="index">
                            <td>
                                <a :href="window.location.href" class="text-danger mr-2" v-if="presetFields.indexOf(key) === -1" @click="removeRequestField(key)"><i class="fas fa-trash"></i></a>
                                <code>{{key}}</code>
                            </td>
                            <td>
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="mapping[key].leadfield" />
                                    <div class="input-group-append">
                                        <button type="button" class="btn btn-light dropdown-toggle btn-icon" data-toggle="dropdown" aria-expanded="false"></button>
                                        <div class="dropdown-menu dropdown-menu-right" style="max-height:187px; overflow-y: scroll;">
                                            <a v-for="(name, i) in leadmapping" :key="i" :href="window.location.href" @click="setFieldName(key, name)" class="dropdown-item"><code>{{name}}</code></a>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <select class="form-control" v-model="mapping[key].type">
                                    <option value="general">General</option>
                                    <option value="name">Name</option>
                                    <option value="fullname">Full Name</option>
                                    <option value="email">Email</option>
                                    <option value="genericphone">generic Phone Number</option>
                                    <option value="phone">Phone Number</option>
                                    <option value="country">Country</option>
                                    <option value="date">Date</option>
                                    <option value="datetime">Date/Time</option>
                                    <option value="ip">IP Address</option>
                                    <option value="boolean">Boolean</option>
                                </select>
                            </td>
                            <td>
                                <input type="text" class="form-control" v-model="mapping[key].default" />
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Add a Request Field</th>
                            <th colspan="3">
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="fieldToAdd" />
                                    <div class="input-group-append">
                                        <button type="button" class="btn btn-outline-success" @click="addRequestField()">Add</button>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <tag-field v-if="!loading && !error" v-model="tags" label="Add tags to the captured Leads" />
            <div v-if="!loading && !error" class="form-group">
                <label class="font-weight-semibold">Auto Export to APIs</label>
                <div class="input-group mb-3">
                    <searchable-select class="custom-select" v-model="autoexports" multiple>
                        <option v-for="(job, index) in apis" :key="index" :value="job.id">{{job.name}}</option>
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="loadAPIs()" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="icon-database-refresh"></i></button>
                    </div>
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
                fieldToAdd: null,
                title: 'generic Capture Endpoint',
                name: null,
                mapping: {
                    fname: {
                        leadfield: 'fname',
                        type: 'name',
                        default: null,
                    },
                    lname: {
                        leadfield: 'lname',
                        type: 'name',
                        default: null,
                    },
                    email: {
                        leadfield: 'email',
                        type: 'email',
                        default: null,
                    },
                    phone: {
                        leadfield: 'phone',
                        type: 'phone',
                        default: null,
                    },
                    country: {
                        leadfield: 'country',
                        type: 'country',
                        default: null,
                    },
                },
                hash: null,
                tags: '',
                autoexports: [],
                loading: true,
                error: null,
                leadmapping: [],
                configuration: {
                },
                presetFields: [
                    'fname',
                    'lname',
                    'email',
                    'phone',
                    'country',
                ],
                window: window,
                apis: [],
            }
        },
        async mounted() {
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create Create a Generic Capture Endpoint' : `Edit Generic Capture Endpoint #${this.$route.params.id}`;
            if ('undefined' !== typeof(this.$route.params.id)) {
                await new Promise( async (resolve) => {
                    await this.loadAPIs();
                    await this.loadMapping();
                    await this.loadEndpointInformation();
                    this.loading = false;
                    resolve();
                })
            } else {
                await this.loadAPIs();
                await this.loadMapping();
                this.$nextTick(() => {
                    this.loading = false;
                });
            }
            
        },
        methods: {
            async loadAPIs() {
                this.apis = [];
                axios.get('/export-apis/all').then( (response) => {
                    this.apis = response.data.body;
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            addRequestField() {
                const name = this.fieldToAdd;
                this.fieldToAdd = null;
                if (Object.keys(this.mapping).indexOf(name) === -1) {
                    this.mapping[name] = {
                        leadfield: '',
                        type: 'general',
                        default: null,
                    }
                    this.$forceUpdate();
                }
            },
            removeRequestField(name) {
                if (Object.keys(this.mapping).indexOf(name) > -1 && this.presetFields.indexOf(name) === -1) {
                    delete this.mapping[name];
                    this.$forceUpdate();
                }
            },
            setFieldName(index, name) {
                this.mapping[index].leadfield = name;
                this.$forceUpdate();
            },
            setFieldOption(index, property, value) {
                this.mapping[index].options[property] = value;
                this.$forceUpdate();
            },
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the generic Capture Endpoint. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? '/capture-endpoints/' : `/capture-endpoints/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            type: 'generic',
                            mapping: this.mapping,
                            tags: this.tags,
                            autoexports: this.autoexports
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved generic Capture Endpoint Successfully.',
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
                        this.$router.push(`/capture/endpoints/generic/${response.data.body.id}`);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadEndpointInformation() {
                this.loading = true;
                const path = `/capture-endpoints/${this.$route.params.id}`;
                try {
                    const response = await axios.get(path);
                    this.name = response.data.body.name;
                    this.hash = response.data.body.hash;
                    this.mapping = response.data.body.mapping;
                    this.tags = response.data.body.tags.join(',');
                    this.autoexports = response.data.body.autoexports;
                    this.$forceUpdate();
                    //this.provider = response.data.body.service;
                    //this.$nextTick( () => {
                    //    this.configuration = response.data.body.configuration;
                    //})
                } catch (error) {
                    handleAxiosError(error);
                    this.error = 'Unable to load endpoint information';
                }
            },
            async loadMapping() {
                this.leadmapping = [];
                axios.get('/system/field-mapping').then( (response) => {
                    this.leadmapping = [];
                    const pushName = (name) => {
                        if (['created_at', 'updated_at', 'files', 'tags'].indexOf(name) === -1) {
                            this.leadmapping.push(name);
                        }
                    }
                    for(let name in response.data.body) {
                        if (!name.includes('.') && this.leadmapping.indexOf(name) === -1) {
                            pushName(name);
                        }
                        if (name.includes('.')) {
                            const parts = name.split('.');
                            if (this.leadmapping.indexOf(parts[0]) === -1) {
                                pushName(parts[0]);
                            }
                        }
                    }
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
        },
        watch: {
            "$route": async function(newVal, oldVal) {
                this.title = ('undefined' === typeof(newVal.params.id)) ? 'Create Create a Generic Capture Endpoint' : `Edit Generic Capture Endpoint #${newVal.params.id}`;
                if ('undefined' !== typeof(newVal.params.id)) {
                    await new Promise( async (resolve) => {
                        await this.loadAPIs();
                        await this.loadMapping();
                        await this.loadEndpointInformation();
                        this.loading = false;
                        resolve();
                    })
                } else {
                    await this.loadAPIs();
                    await this.loadMapping();
                    this.$nextTick(() => {
                        this.loading = false;
                    });
                }
            }
        }
    }
</script>