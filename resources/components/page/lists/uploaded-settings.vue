<template>
   <div class="card">
        <div class="card-header header-elements-inline">
            <h5 class="card-title">Setup Import Settings<span v-if="file">&nbsp;for <code>{{file.name}}</code></span></h5>
        </div>
        <div class="card-body">
            <div class="loading" v-if="loading">
                Loading...
            </div>
            <div v-if="error" class="error">
              <div class="alert alert-danger">{{ error }}</div>
            </div>
            <form v-if="file" action="javascript:false;">
                <form-wizard
                    title=""
                    subtitle=""
                    color="#2196F3"
                    errorColor="#F44336"
                    @on-complete="submitForm()"
                >   
                    <tab-content title="File Type">
                        <div class="form-group">
                            <label class="font-weight-semibold">Copy settings from another import job</label>
                            <div class="input-group mb-3">
                                <searchable-select class="custom-select" v-model="copyFromImportJob">
                                    <option v-for="(job, index) in importJobs" :key="index" :value="index">{{job.name}}</option>
                                </searchable-select>
                                <div class="input-group-append">
                                    <button @click="loadListsWithSettings()" class="btn btn-outline-secondary" type="button" id="button-addon2"><i class="icon-database-refresh"></i></button>
                                    <button @click="copySettingsFromExistingJob()" v-if="copyFromImportJob !== null" class="btn btn-outline-success" type="button" id="button-addon2"><i class="icon-copy3"></i></button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="font-weight-semibold">What is the file type of <code>{{file.name}}</code></label>
                            <div class="form-check">
                                <label class="form-check-label">
                                    <input type="radio" class="form-check-input" name="filetype" value="csv" v-model="fileSetting.filetype">
                                    <code>.csv</code>, <code>.txt</code> or other plaintext delimited formats
                                </label>
                            </div>
                            <div class="form-check">
                                <label class="form-check-label">
                                    <input type="radio" class="form-check-input" name="filetype" value="excel" v-model="fileSetting.filetype">
                                    <code>.xls</code>, <code>.xlsx</code> or other spreadsheet program formats
                                </label>
                            </div>
                        </div>
                    </tab-content>
                    <tab-content title="Columns Settings and Mapping">
                        <file-mapper-and-preview
                            v-model="this.fileSetting"
                            :mapping="mapping"
                            @preview-loaded="updateLastPreviewTime()"
                        />
                    </tab-content>
                    <tab-content title="Conversion Mapping">
                        <specific-file-mapper-and-preview
                            v-model="fileSetting"
                            :file="$route.params.id"
                            :mapping="mapping"
                            count="3"
                            class="mb-3"
                            :lastPreviewTime="lastPreviewTime"
                        />
                        <div class="row mb-3">
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-primary-400 text-white">
                                        <h6 class="card-title"><i class="icon-touch mr-2"></i>Click Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.click.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.click.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.click.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Network</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.click.network.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.click.network.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Funnel</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.click.funnel.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.click.funnel.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Affiliate</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.click.affiliate.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.click.affiliate.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-teal-400 text-white">
                                        <h6 class="card-title"><i class="icon-user mr-2"></i>Subscription Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.subscription.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.subscription.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.subscription.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Network</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.subscription.network.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.subscription.network.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Funnel</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.subscription.funnel.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.subscription.funnel.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Affiliate</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.subscription.affiliate.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.subscription.affiliate.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-teal-600 text-white">
                                        <h6 class="card-title"><i class="icon-user mr-2"></i>Registration Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.registration.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.registration.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.registration.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Network</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.registration.network.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.registration.network.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Funnel</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.registration.funnel.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.registration.funnel.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Affiliate</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.registration.affiliate.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.registration.affiliate.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-success text-white">
                                        <h6 class="card-title"><i class="icon-phone-outgoing mr-2"></i>Call Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.call.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.call.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.call.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Broker</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.call.broker.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.call.broker.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Disposition</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.call.disposition.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.call.disposition.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-success-400 text-white">
                                        <h6 class="card-title"><i class="icon-coin-dollar mr-2"></i>FTD Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.ftd.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.ftd.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.ftd.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Broker</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.ftd.broker.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.ftd.broker.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Amount</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.ftd.amount.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.ftd.amount.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Currency</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.ftd.currency.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.ftd.currency.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card">
                                    <div class="card-header bg-success-800 text-white">
                                        <h6 class="card-title"><i class="icon-coins mr-2"></i>Upsale Conversion Mapping</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Has Conversion</label>
                                            <div class="input-group mb-3">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.upsale.has">
                                                    <option :value="true">Yes</option>
                                                    <option :value="false">No</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Date/Time</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.upsale.date.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.upsale.date.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Broker</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.upsale.broker.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.upsale.broker.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Amount</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.upsale.amount.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.upsale.amount.default" placeholder="Default" />
                                        </div>
                                        <div class="form-group">
                                            <label class="font-weight-semibold">Conversion Currency</label>
                                            <div class="input-group">
                                                <searchable-select class="form-control" v-model="fileSetting.conversion_settings.upsale.currency.mapping">
                                                    <option :value="null">None</option>
                                                    <option value="-1">Default</option>
                                                    <option v-for="(settings, column_id, index) in fileSetting.column_settings" :key="index" :value="column_id">Column {{column_id}} Value</option>
                                                </searchable-select>
                                            </div>
                                            <input type="text" class="form-control" v-model="fileSetting.conversion_settings.upsale.currency.default" placeholder="Default" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </tab-content>
                    <tab-content title="Tags">
                        <tag-field v-model="fileSetting.tags" label="Add tags to categorize the file" />
                    </tab-content>
                </form-wizard>
            </form>
        </div>
    </div>
</template>

<script>
    import {FormWizard, TabContent} from 'vue-form-wizard'
    import 'vue-form-wizard/dist/vue-form-wizard.min.css'
    export default {
        components: {
            FormWizard,
            TabContent
        },
        data () {
            return {
                lastPreviewTime: 0,
                loading: false,
                file: null,
                error: null,
                fileSetting: {
                    filetype: null,
                    column_delimiter: ',',
                    column_quotation: '"',
                    header_row: 1,
                    column_settings: {},
                    tags: '',
                    conversion_settings: {
                        click: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            network: {
                                mapping: null,
                                default: null,
                            },
                            funnel: {
                                mapping: null,
                                default: null,
                            },
                            affiliate: {
                                mapping: null,
                                default: null,
                            },
                        },
                        subscription: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            network: {
                                mapping: null,
                                default: null,
                            },
                            funnel: {
                                mapping: null,
                                default: null,
                            },
                            affiliate: {
                                mapping: null,
                                default: null,
                            },
                        },
                        registration: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            network: {
                                mapping: null,
                                default: null,
                            },
                            funnel: {
                                mapping: null,
                                default: null,
                            },
                            affiliate: {
                                mapping: null,
                                default: null,
                            },
                        },
                        call: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            broker: {
                                mapping: null,
                                default: null,
                            },
                            disposition: {
                                mapping: null,
                                default: null,
                            },
                        },
                        ftd: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            broker: {
                                mapping: null,
                                default: null,
                            },
                            amount: {
                                mapping: null,
                                default: null,
                            },
                            currency: {
                                mapping: null,
                                default: null,
                            },
                        },
                        upsale: {
                            has: null,
                            date: {
                                mapping: null,
                                default: null,
                            },
                            broker: {
                                mapping: null,
                                default: null,
                            },
                            amount: {
                                mapping: null,
                                default: null,
                            },
                            currency: {
                                mapping: null,
                                default: null,
                            },
                        },
                    },
                },
                importJobs: null,
                copyFromImportJob: null,
                mapping: {},
                window,
            }
        },
        created () {
            this.fetchData()
        },
        mounted() {
            this.loadMapping();
        },
        watch: {
            '$route': 'fetchData'
        },
        methods: {
            updateLastPreviewTime() {
                this.lastPreviewTime ++;
            },
            fetchData () {
                this.error = this.file = null
                this.loading = true
                const path = `/lists/${this.$route.params.id}`;
                axios.get(path).then( (response) => {
                    this.loading = false;
                    this.file = response.data.body;
                    if (null !== this.file.setting) {
                        const oldConversionSettings = this.fileSetting.conversion_settings;
                        this.fileSetting = this.file.setting;
                        if ('object' !== typeof(this.fileSetting.conversion_settings) || null === this.fileSetting.conversion_settings || Object.keys(this.fileSetting.conversion_settings).length === 0) {
                            this.fileSetting.conversion_settings = oldConversionSettings;
                        }
                    }
                })
                .catch( (error) => {
                    this.loading = false;
                    this.error = 'Unable to load page';
                    handleAxiosError(error);
                });
            },
            setDelimiter(del) {
                this.fileSetting.column_delimiter = del;
            },
            setQuotation(del) {
                this.fileSetting.column_quotation = del;
            },
            updateFieldSetting(param) {
                console.log(this);
            },
            async submitForm() {
                const path = `/lists/${this.$route.params.id}/settings`;
                await swal({
                    title: 'Confirmation',
                    text: 'Are you sure that you want to save these changes?',
                    type: 'question',
                    buttonsStyling: false,
                    confirmButtonClass: 'btn btn-primary',
                    cancelButtonClass: 'btn btn-light',
                    showCancelButton: true,
                    confirmButtonText: 'Yes'
                }).then(async (result) => {
                    if (result.value) {
                        swal({
                            title: 'Processing',
                            text: 'Please wait until the changes are saved',
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
                        axios.post(path, this.fileSetting).then( (response) => {
                            swal({
                                title: 'Success',
                                text: 'Saved File Import Settings Successfully',
                                type: 'success',
                                buttonsStyling: false,
                                confirmButtonClass: 'btn btn-success',
                                cancelButtonClass: 'btn btn-primary',
                                showCancelButton: true,
                                confirmButtonText: 'Start Import',
                                cancelButtonText: 'Close'
                            }).then( async (result) => {
                                if (result.value) {
                                    //this.$router.push(`/lists/uploaded/${this.$route.params.id}/start`);
                                    try {
                                        const response = await axios.post(`/lists/${this.$route.params.id}/start`, {});
                                        if (response.status >= 200 && response.status < 300) {
                                            this.$router.push(`/lists/processing`);
                                        } else {
                                            PNotify.danger({
                                                title: 'Error',
                                                text: 'Failed to start Job',
                                                type: 'danger'
                                            });
                                        }
                                    } catch (error) {
                                        PNotify.danger({
                                            title: 'Error',
                                            text: error.toString(),
                                            type: 'danger'
                                        });
                                    }
                                }
                            })
                        })
                        .catch( (error) => {
                            swal.close();
                            handleAxiosError(error);
                        });      
                    }
                })
            },
            async loadListsWithSettings() {
                this.importJobs = null;
                this.copyFromImportJob = null;
                axios.get('/lists/with-settings').then( (response) => {
                    this.importJobs = response.data.body;
                    PNotify.info({
                        title: 'Loaded Jobs with Import Settings',
                        text: 'Jobs with import settings have been loaded. Please choose one from the dropdown list to continue.',
                        type: 'info'
                    });
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
            async copySettingsFromExistingJob() {
                const settingsToCopy = this.importJobs[this.copyFromImportJob].setting;
                this.fileSetting.filetype = settingsToCopy.filetype;
                this.fileSetting.column_delimiter = settingsToCopy.column_delimiter;
                this.fileSetting.column_quotation = settingsToCopy.column_quotation;
                this.fileSetting.header_row = settingsToCopy.header_row;
                this.fileSetting.column_settings = settingsToCopy.column_settings;
                this.fileSetting.tags = settingsToCopy.tags;
                this.fileSetting.conversion_settings = settingsToCopy.conversion_settings;
                PNotify.success({
                    title: 'Settings copied successfully',
                    text: 'You can continue the wizard',
                    type: 'success'
                });
            },
            async loadMapping() {
                axios.get('/system/field-mapping').then( (response) => {
                    this.mapping = [];
                    const pushName = (name) => {
                        if (['fname', 'lname', 'email', 'phone', 'country', 'created_at', 'updated_at', 'files', 'tags'].indexOf(name) === -1) {
                            this.mapping.push(name);
                        }
                    }
                    for(let name in response.data.body) {
                        if (!name.includes('.') && this.mapping.indexOf(name) === -1) {
                            pushName(name);
                        }
                        if (name.includes('.')) {
                            const parts = name.split('.');
                            if (this.mapping.indexOf(parts[0]) === -1) {
                                pushName(parts[0]);
                            }
                        }
                    }
                })
                .catch( (error) => {
                    handleAxiosError(error);
                }); 
            },
        }
    }
</script>