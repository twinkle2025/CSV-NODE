<template>
    <div :id="this._uid">
        <div class="table-responsive mb-1" v-if="!loading && 'object' === typeof(this.value.column_settings) && ( (!Array.isArray(this.value.column_settings) && Object.keys(this.value.column_settings).length > 0) || Array.isArray(this.value.column_settings) && Othis.value.column_settings.length > 0 )">
            <table class="table table-bordered table-stripped table-hover table-xs text-nowrap file-preview-table">
                <thead>
                    <tr>
                        <th>
                            Column
                        </th>
                        <th v-for="(column, index) in this.value.column_settings" :key="index" class="text-center"><code>{{index}}</code></th>
                    </tr>
                    <tr>
                        <th>Field Name</th>
                        <th v-for="(column, index) in this.value.column_settings" :key="index">
                            <code>{{value.column_settings[index].name}}</code>
                            <!-- <div class="input-group">
                                <input type="text" class="form-control" v-model="value.column_settings[index].name" @change="$emit('updated')" />
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-light dropdown-toggle btn-icon" data-toggle="dropdown" aria-expanded="false"></button>
                                    <div class="dropdown-menu dropdown-menu-right" style="max-height:187px; overflow-y: scroll;">
                                        <a :href="window.location.href" @click="setFieldName(index, 'fname')" class="dropdown-item">First Name</a>
                                        <a :href="window.location.href" @click="setFieldName(index, 'lname')" class="dropdown-item">Last Name</a>
                                        <a :href="window.location.href" @click="setFieldName(index, 'email')" class="dropdown-item">Email Address</a>
                                        <a :href="window.location.href" @click="setFieldName(index, 'phone')" class="dropdown-item">Phone Number</a>
                                        <a :href="window.location.href" @click="setFieldName(index, 'country')" class="dropdown-item">Country</a>
                                        <a v-for="(name, i) in mapping" :key="i" :href="window.location.href" @click="setFieldName(index, name)" class="dropdown-item"><code>{{name}}</code></a>
                                    </div>
                                </div>
                            </div> -->
                        </th>
                    </tr>
                    <!-- <tr>
                        <th>Field Type</th>
                        <th v-for="(column, index) in this.value.column_settings" :key="index">
                            <select class="form-control" v-model="value.column_settings[index].type" @change="$emit('updated')">
                                <option value="general">General</option>
                                <option value="name">Name</option>
                                <option value="fullname">Full Name</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone Number</option>
                                <option value="leadpagesphone">LeadPages Phone Number</option>
                                <option value="country">Country</option>
                                <option value="date">Date</option>
                                <option value="datetime">Date/Time</option>
                                <option value="ip">IP Address</option>
                                <option value="boolean">Boolean</option>
                            </select>
                        </th>
                    </tr>
                    <tr>
                        <th>Default Value</th>
                        <th v-for="(column, index) in this.value.column_settings" :key="index">
                            <div class="input-group">
                                <input type="text" class="form-control" v-model="value.column_settings[index].options.default" @change="$emit('updated')" />
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-light dropdown-toggle btn-icon" data-toggle="dropdown" aria-expanded="false"></button>
                                    <div class="dropdown-menu dropdown-menu-right">
                                        <a :href="window.location.href" @click="setFieldOption(index, 'default', 'null')" class="dropdown-item"><code>NULL</code></a>
                                        <a :href="window.location.href" @click="setFieldOption(index, 'default', 'true')" class="dropdown-item" v-if="['boolean'].indexOf(value.column_settings[index].type) > -1"><code>TRUE</code></a>
                                        <a :href="window.location.href" @click="setFieldOption(index, 'default', 'false')" class="dropdown-item" v-if="['boolean'].indexOf(value.column_settings[index].type) > -1"><code>FALSE</code></a>
                                        <a :href="window.location.href" @click="setFieldOption(index, 'default', 'NOW()')" class="dropdown-item" v-if="['date', 'datetime'].indexOf(value.column_settings[index].type) > -1"><code>NOW()</code></a>
                                    </div>
                                </div>
                            </div>
                        </th>
                    </tr>
                    <tr v-if="needsFormat">
                        <th>Format</th>
                        <th v-for="(column, index) in this.value.column_settings" :key="index">
                            <input type="text" class="form-control" v-model="value.column_settings[index].options.format" v-if="['date', 'datetime'].indexOf(column.type) > -1" @change="$emit('updated')" />
                        </th>
                    </tr> -->
                </thead>
                <tbody>
                    <tr v-for="(row, index) in rows" :key="index">
                        <td class="text-center">Sample Row #{{index}}</td>
                        <td v-for="(column, index) in value.column_settings" :key="index">
                            <span v-if="['general', 'name'].indexOf(value.column_settings[index].type) > -1">
                                {{row[index]}}
                            </span>
                            <span v-if="['ip', 'boolean'].indexOf(value.column_settings[index].type) > -1">
                                <code>{{row[index]}}</code>
                            </span>
                            <span v-if="['email', 'phone', 'country', 'fullname', 'leadpagesphone'].indexOf(value.column_settings[index].type) > -1 && 'object' === typeof(row[index])">
                                <i class="icon-spam text-danger mr-3" title="Unparseable Value" v-if="!row[index].valid"></i>
                                <i class="icon-checkmark4 text-success mr-3" title="Parsable Value" v-if="row[index].valid"></i>
                                <i class="icon-mobile3 text-info mr-3" title="Possible Mobile Number" v-if="row[index].is_mobile"></i>
                                <i class="icon-phone text-info mr-3" title="Possible Landline Number" v-if="row[index].is_landline"></i>
                                <i class="icon-phone-slash text-warning mr-3" title="Unrecognized Line Type" v-if="'phone' === value.column_settings[index].type && row[index].valid && !row[index].is_mobile && !row[index].is_landline"></i>
                                <code v-if="!row[index].valid">{{row[index].value}}</code>
                                <span v-else-if="value.column_settings[index].type === 'country'">{{ getName(row[index].value) }}</span>
                                <span v-else-if="value.column_settings[index].type === 'phone'">{{ row[index].preview }}</span>
                                <span v-else-if="value.column_settings[index].type === 'fullname'"><code>{{ JSON.stringify(row[index]) }}</code></span>
                                <span v-else-if="value.column_settings[index].type === 'leadpagesphone'"><code>{{ JSON.stringify({
                                    valid: row[index].valid,
                                    country: row[index].country.value,
                                    phone: row[index].phone.preview
                                    }) }}</code></span>
                                <span v-else>{{row[index].value}}</span>
                            </span>
                            <span v-if="['datetime'].indexOf(value.column_settings[index].type) > -1">
                                <span v-if="moment(row[index]).isValid()"><i class="icon-checkmark4 text-success mr-3" title="Parsable Value"></i>{{ moment(row[index]).format('MMMM Do YYYY, h:mm:ss a') }}</span>
                                <span v-else>
                                    <i class="icon-spam text-danger mr-3" title="Unparseable Value"></i>
                                    <code>{{row[index]}}</code>
                                </span>
                            </span>
                            <span v-if="['date'].indexOf(value.column_settings[index].type) > -1">
                                <span v-if="moment(row[index]).isValid()"><i class="icon-checkmark4 text-success mr-3" title="Parsable Value"></i>{{ moment(row[index]).format('MMMM Do YYYY') }}</span>
                                <span v-else>
                                    <i class="icon-spam text-danger mr-3" title="Unparseable Value"></i>
                                    <code>{{row[index]}}</code>
                                </span>
                            </span>
                            <span v-if="['email', 'phone', 'country', 'fullname', 'leadpagesphone'].indexOf(value.column_settings[index].type) > -1 && 'object' !== typeof(row[index])">
                                <i class="icon-warning22 text-warning mr-3" title="Please Refresh the Preview"></i>{{row[index]}}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="alert alert-info p-1" v-else-if="!loading && ('object' !== typeof(this.value.column_settings) || Array.isArray(this.value.column_settings) || Object.keys(this.value.column_settings).length === 0 )">
            Preview information not yet loaded.
        </div>
        <div class="alert alert-info p-1" v-else>
            Loading Preview. Please wait.
        </div>
    </div>
</template>

<script>
    import param from "can-param";
    import moment from 'moment-timezone';
    const CancelToken = axios.CancelToken;
    const { getName } = require('country-list');
    let cancel;
    export default {
        data() {
            return {
                jsoncopy: null,
                rows: [],
                loading: false,
                previewColumnSettings: {},
                needsFormat: false,
                moment,
                getName,
                window,
            };
        },
        props: ['value', 'mapping', 'file', 'lastPreviewTime', 'count'],
        mounted() {
            this.loadPreview();
        },
        computed: {
        },
        methods: {
            loadPreview() {
                // if ('function' === typeof(cancel)) {
                //     cancel();
                // }
                this.rows = [];
                this.loading = true;
                const path = `/lists/${this.file}/preview?count=${this.count}`;
                axios.post(path, this.value, {
                    cancelToken: new CancelToken(function executor(c) {
                        cancel = c;
                    }),
                }).then( (response) => {
                    const data = response.data.body;
                    this.loading = false;
                    this.rows = data.rows;
                    this.value.column_settings = data.column_settings;
                    this.$forceUpdate();
                    this.$emit('updated');
                })
                .catch( (error) => {
                    if (axios.isCancel(error)) {
                        return;
                    }
                    this.loading = false;
                    this.rows = [];
                    handleAxiosError(error);
                });
            },
            setFieldName(index, name) {
                this.value.column_settings[index].name = name;
                this.$emit('updated');
            },
            setFieldOption(index, property, value) {
                this.value.column_settings[index].options[property] = value;
                this.$emit('updated');
            },
            addNewColumn() {
                const currrentColumns = Object.values(this.value.column_settings);
                const newKey = currrentColumns.length;
                this.value.column_settings[newKey] = {
                    name: '',
                    options: {
                        default: '',
                    },
                    type: 'general',
                    virtual: true,
                }
                this.loadPreview();
            }
        },
        watch: {
            value: {
                immediate: true,
                deep: true,
                handler(val, oldVal) {
                    if (JSON.stringify(val) === this.jsoncopy) {
                        return;
                    }
                    this.jsoncopy = JSON.stringify(val);
                    this.needsFormat = false;
                    for (let key in this.value.column_settings) {
                        const column = this.value.column_settings[key];
                        if (['date', 'datetime'].indexOf(column.type) > -1) {
                            this.value.column_settings[key].options.format = '';
                            this.needsFormat = true;
                        }
                    }
                },
            },
            lastPreviewTime(val, oldVal) {
                if (null === val) {
                    return;
                }
                this.loadPreview();
            }
        },
    }
</script>