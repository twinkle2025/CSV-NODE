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
                <label>Endpoint URLs</label><br />
                <small>SMS Handler</small>
                <input type="url" class="form-control" readonly :value="`${window.location.origin}/twilio/${hash}/sms`"  />
                <small>Phone Call Handler</small>
                <input type="url" class="form-control" readonly :value="`${window.location.origin}/twilio/${hash}/phone`"  />
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label>Endpoint Name</label>
                <input type="text" v-model="name" class="form-control form-control-lg" />
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label><a href="https://www.twilio.com/docs/glossary/what-is-twilio-markup-language-twiml" target="_blank">TwiML</a> for Valid SMS</label>
                <editor v-model="mapping.sms.valid" @init="smsValidXmlEditorInit" lang="xml" theme="chrome" width="100%" height="250px" class="mb-1"></editor>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Add Mail-Merge Variable</span>
                    </div>
                    <searchable-select class="custom-select" v-model="mailmerges.sms.valid">
                        <option value="To">Twilio Recipient (To)</option>
                        <option value="From">Twilio Sender (From)</option>
                        <option v-for="(type, key, index) in leadmapping" :key="index" :value="`{{${key}}}`">{{key}}</option>
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="addMailMergeValueToEditor(editors.sms.valid, mailmerges.sms.valid)" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                    </div>
                </div>
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label><a href="https://www.twilio.com/docs/glossary/what-is-twilio-markup-language-twiml" target="_blank">TwiML</a> for Invalid SMS</label>
                <editor v-model="mapping.sms.invalid" @init="smsInvalidXmlEditorInit" lang="xml" theme="chrome" width="100%" height="250px" class="mb-1"></editor>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Add Mail-Merge Variable</span>
                    </div>
                    <searchable-select class="custom-select" v-model="mailmerges.sms.invalid">
                        <option value="To">Twilio Recipient (To)</option>
                        <option value="From">Twilio Sender (From)</option>
                        <!-- <option v-for="(type, key, index) in leadmapping" :key="index" :value="`{{${key}}}`">{{key}}</option> -->
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="addMailMergeValueToEditor(editors.sms.invalid, mailmerges.sms.invalid)" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                    </div>
                </div>
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label><a href="https://www.twilio.com/docs/glossary/what-is-twilio-markup-language-twiml" target="_blank">TwiML</a> for Valid Phone Call</label>
                <editor v-model="mapping.phone.valid" @init="phoneValidXmlEditorInit" lang="xml" theme="chrome" width="100%" height="250px" class="mb-1"></editor>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Add Mail-Merge Variable</span>
                    </div>
                    <searchable-select class="custom-select" v-model="mailmerges.phone.valid">
                        <option value="To">Twilio Recipient (To)</option>
                        <option value="From">Twilio Sender (From)</option>
                        <option v-for="(type, key, index) in leadmapping" :key="index" :value="`{{${key}}}`">{{key}}</option>
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="addMailMergeValueToEditor(editors.phone.valid, mailmerges.phone.valid)" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                    </div>
                </div>
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label>SMS Message for Valid Phone Call</label>
                <editor v-model="mapping.phone.validSMS" @init="phoneValidTextEditorInit" lang="xml" theme="chrome" width="100%" height="250px" class="mb-1"></editor>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Add Mail-Merge Variable</span>
                    </div>
                    <searchable-select class="custom-select" v-model="mailmerges.phone.validSMS">
                        <option v-for="(type, key, index) in leadmapping" :key="index" :value="`{{${key}}}`">{{key}}</option>
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="addMailMergeValueToEditor(editors.phone.validSMS, mailmerges.phone.validSMS)" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
                    </div>
                </div>
                <label class="mt-2">Sent via:</label>
                <searchable-select class="form-control form-control-lg" v-model="mapping.provider">
                    <option v-for="(info, pi, index) in smsProviders" :key="index" :value="info.id">{{info.name}} ({{info.service}})</option>
                </searchable-select>
            </div>
            <div v-if="!loading && !error" class="form-group">
                <label><a href="https://www.twilio.com/docs/glossary/what-is-twilio-markup-language-twiml" target="_blank">TwiML</a> for Invalid Phone Call</label>
                <editor v-model="mapping.phone.invalid" @init="phoneInvalidXmlEditorInit" lang="xml" theme="chrome" width="100%" height="250px" class="mb-1"></editor>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Add Mail-Merge Variable</span>
                    </div>
                    <searchable-select class="custom-select" v-model="mailmerges.phone.invalid">
                        <option value="To">Twilio Recipient (To)</option>
                        <option value="From">Twilio Sender (From)</option>
                        <!-- <option v-for="(type, key, index) in leadmapping" :key="index" :value="`{{${key}}}`">{{key}}</option> -->
                    </searchable-select>
                    <div class="input-group-append">
                        <button @click="addMailMergeValueToEditor(editors.phone.invalid, mailmerges.phone.invalid)" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-add"></i></button>
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
                title: 'Twilio Endpoint',
                name: null,
                mailmerges: {
                    sms: {
                        valid: null,
                        invalid: null,
                    },
                    phone: {
                        valid: null,
                        invalid: null,
                        validSMS: null,
                    }
                },
                editors: {
                    sms: {
                        valid: null,
                        invalid: null,
                    },
                    phone: {
                        valid: null,
                        invalid: null,
                        validSMS: null,
                    }
                },
                mapping: {
                    sms: {
                        valid: '<?xml version="1.0" encoding="UTF-8"?>' + "\n",
                        invalid: '<?xml version="1.0" encoding="UTF-8"?>' + "\n",
                    },
                    phone: {
                        valid: '<?xml version="1.0" encoding="UTF-8"?>' + "\n",
                        invalid: '<?xml version="1.0" encoding="UTF-8"?>' + "\n",
                        validSMS: '',
                    },
                    provider: null,
                },
                hash: null,
                tags: '',
                autoexports: [],
                loading: true,
                error: null,
                leadmapping: {},
                smsProviders: {},
                configuration: {
                },
                window: window,
                apis: [],
            }
        },
        async mounted() {
            this.title = ('undefined' === typeof(this.$route.params.id)) ? 'Create Create a Twilio Endpoint' : `Edit Twilio Endpoint #${this.$route.params.id}`;
            if ('undefined' !== typeof(this.$route.params.id)) {
                await new Promise( async (resolve) => {
                    await this.loadMapping();
                    await this.loadEndpointInformation();
                    await this.loadSMSProviders();
                    this.loading = false;
                    resolve();
                })
            } else {
                await this.loadSMSProviders();
                await this.loadMapping();
                this.$nextTick(() => {
                    this.loading = false;
                });
            }
            
        },
        methods: {
            addMailMergeValueToEditor(editor, value) {
                if (value) {
                    editor.session.insert(editor.getCursorPosition(), value);
                    value = null;
                }
            },
            smsValidXmlEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/xml')
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(true);
                this.editors.sms.valid = editor;
            },
            smsInvalidXmlEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/xml')
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(true);
                this.editors.sms.invalid = editor;
            },
            phoneValidXmlEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/xml')
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(true);
                this.editors.phone.valid = editor;
            },
            phoneValidTextEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/text')                
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(false);
                this.editors.phone.validSMS = editor;
            },
            phoneInvalidXmlEditorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/xml')
                require('brace/theme/chrome')
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(true);
                this.editors.phone.invalid = editor;
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
            async loadSMSProviders() {
                const path = `marketing/sms/providers/all`;
                try {
                    const {data} = await axios.get(path);
                    this.smsProviders = data.body
                } catch (error) {
                    handleAxiosError(error);
                }
            },
            async submitForm() {
                swal({
                    title: 'Processing',
                    text: 'Saving the Twilio Endpoint. Please wait.',
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
                const url = ('undefined' === typeof(this.$route.params.id)) ? '/twilio-endpoints/' : `/twilio-endpoints/${this.$route.params.id}`;
                const method = ('undefined' === typeof(this.$route.params.id)) ? 'post' : 'put';
                try {
                    const response = await axios.request({
                        url,
                        method,
                        data: {
                            name: this.name,
                            type: 'twilio',
                            mapping: this.mapping,
                            tags: this.tags,
                            autoexports: this.autoexports
                        }
                    });
                    await swal({
                        title: 'Success',
                        text: 'Saved Twilio Endpoint Successfully.',
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
                        this.$router.push(`/marketing/sms/twilio/endpoints/${response.data.body.id}`);
                    }
                    swal.close();
                } catch (error) {
                    swal.close();
                    handleAxiosError(error);
                }
            },
            async loadEndpointInformation() {
                this.loading = true;
                const path = `/twilio-endpoints/${this.$route.params.id}`;
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
                this.leadmapping = {};
                axios.get('/system/field-mapping').then( (response) => {
                    this.leadmapping = response.data.body;
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
                        await this.loadMapping();
                        await this.loadEndpointInformation();
                        this.loading = false;
                        resolve();
                    })
                } else {
                    await this.loadMapping();
                    this.$nextTick(() => {
                        this.loading = false;
                    });
                }
            }
        },
        components: {
            editor: require('vue2-ace-editor'),
        }
    }
</script>