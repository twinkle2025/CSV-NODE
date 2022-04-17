<template>
    <div>
        <div class="input-group mb-3">
            <input class="form-control" v-model="search" placeholder="Search for a File">
            <div class="input-group-append">
                <button @click="reloadFilesAndSearch()" class="btn btn-outline-success" type="button"><i class="icon-database-refresh"></i></button>
            </div>
        </div>
        <div class="row">
            <div class="col-12 col-sm-6 col-md-4 col-xl-3" v-for="(file, index) in fileList" :key="index">
                <div :class="(content.indexOf(JSON.stringify(file)) > -1) ? 'card position-relative border-primary' : 'card position-relative'">
                    <span class="d-block text-right position-absolute" style="right:2.5px; z-index:100;">
                        <input type="checkbox" v-model="content" :value="JSON.stringify(file)" />
                    </span>
                    <div class="card-img-actions mx-1 mt-1 d-none d-sm-flex" v-if="'google' === service">
                        <img :class="(file.thumbnailLink) ? 'card-img img-fluid' : 'card-img img-fluid p-3'" :src="(file.thumbnailLink) ? file.thumbnailLink : file.iconLink.replace(16, 128)" :alt="file.name">
                        <div class="card-img-actions-overlay card-img">
                            <a :href="file.webViewLink" target="_blank" class="btn btn-outline bg-white text-white border-white border-2 btn-icon rounded-round ml-2">
                                <i class="icon-eye8"></i>
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-start flex-nowrap">
                            <div class="list-icons list-icons-extended mr-1">
                                <a v-if="'google' === service" class="list-icons-item"><img :src="file.iconLink" class="top-0" /></a>
                            </div>
                            <div>
                                <div class="font-weight-semibold mr-auto">{{file.name}}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row" v-if="!isLoading && nextPageToken">
            <div class="col-12 text-center">
                <button @click="loadListOfFiles()" class="btn btn-block btn-primary text-center" role="button" type="button">
                    Load More
                </button>
            </div>
        </div>
        <div class="row" v-if="isLoading">
            <div class="col-12 text-center">
                <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['service', 'auth', 'value'],
        data() {
            return {
                isLoading: false,
                fileList: [],
                content: this.value,
                nextPageToken: null,
                gotError: false,
                search: null,
            }
        },
        mounted() {
            //this.$nextTick(() => {
            //    this.loadListOfFiles();
            //});
        },
        methods: {
            reloadFilesAndSearch() {
                this.isLoading = true;
                this.fileList = [];
                this.content = [];
                this.nextPageToken = null;
                this.loadListOfFiles();
            },
            async loadListOfFiles() {
                if (null === this.auth) {
                    return false;
                }
                this.isLoading = true;
                const baseUri = `/transfer-from/${this.service}/files`;
                let uri;
                switch(this.service) {
                    case 'google':
                        uri = baseUri + `?token=${JSON.stringify(this.auth)}`;
                        if (this.nextPageToken) {
                            uri += `&pageToken=${this.nextPageToken}`;
                        }
                        if (this.search) {
                            uri += `&search=${this.search}`;
                        }
                        break;

                    case 'mega':
                        uri = baseUri + `?email=${this.auth.username}&password=${this.auth.password}`;
                        if (this.search) {
                            uri += `&search=${this.search}`;
                        }
                        break;

                    default:
                        uri = baseUri;
                        break;
                }
                try {
                    const response = await axios.get(uri);
                    const data = response.data.body;
                    this.nextPageToken = data.nextPageToken;
                    this.fileList.push(...data.fileList);
                    this.isLoading = false;
                } catch (error) {
                    this.isLoading = false;
                    if (this.gotError) {
                        return false;
                    }
                    this.gotError = true;
                    let autherror = false;
                    if ('undefined' !== typeof(error.response)) {
                        if (Array.isArray(error.response.data.errors)) {
                            const e = error.response.data.errors[0];
                            if (['Error: Daily Limit for Unauthenticated Use Exceeded. Continued use requires signup.', 'Error: invalid_request', 'invalidAuth'].indexOf(e.message) > -1) {
                                PNotify.danger({
                                    title: 'Authentication Expired',
                                    text: 'Your Google Drive Authentication Session has expired. Please re-authenticate to continue.',
                                    type: 'danger'
                                });
                                this.$emit('reauthenticate', true);
                                autherror = true;
                            }
                        }
                    }
                    if (!autherror) {
                        handleAxiosError(error);
                    }
                }
            }
        },
        watch: {
            content(newVal, oldVal) {
                this.$emit('input', newVal);
            },
            auth: {
                deep: true,
                handler: function() {
                    this.gotError = false;
                    this.$nextTick(() => {
                        this.loadListOfFiles();
                    });
                }
            }
            //value(newVal, oldVal) {
            //    this.content = [];
            //}
        }
    }
</script>