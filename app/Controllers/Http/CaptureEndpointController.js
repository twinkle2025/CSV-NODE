'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const CaptureEndpoint = use('App/Models/CaptureEndpoint');
const {validate} = use('Validator');
require('newrelic');


/**
 * Resourceful controller for interacting with captureendpoints
 */
class CaptureEndpointController {
  /**
   * Show a list of all capture endpoints.
   * GET captureendpoints
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({
    request,
    response,
    view
  }) {
    // Validation
    const rules = {
      type: 'required|string'
    }
    const validation = await validate(request.all(), rules)
    if (validation.fails()) {
      return response.api(400, null, validation.messages());
    }
    const {
      type
    } = request.all();
    const query = CaptureEndpoint.query().where('type', '=', type);
    if ('object' === typeof (request.input('search')) && null !== request.input('search')) {
      const search = request.input('search');
      if ('undefined' !== typeof (search.value) && search.value.length > 0) {
        query.where('name', 'like', `%${search.value}%`);
      }
    }
    let start = request.input('start');
    let length = request.input('length');
    const columns = request.input('columns');
    const order = request.input('order');
    if (Array.isArray(order)) {
      for (let i = 0; i < order.length; i++) {
        const orderer = order[i];
        const column = columns[orderer.column];
        query.orderBy(column.name, orderer.dir);
      }
    }
    if ('undefined' === typeof (start) || null === start || parseInt(start) < 0) {
      start = 0;
    }
    if ('undefined' === typeof (length) || null === length || parseInt(length) < 10) {
      length = 10;
    }
    start++;
    const startPage = Math.ceil(start / length);
    const paginatedResults = await query.paginate(startPage, length);
    const rows = [];
    for (let i = 0; i < paginatedResults.rows.length; i++) {
      const row = paginatedResults.rows[i];
      rows.push([row.id, row.name, row.hash]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  async create({
    request,
    response,
    view
  }) {
    const md5 = require('md5');
    const rules = {
      name: 'required|string|unique:capture_endpoints,name',
      mapping: 'required',
      type: 'required|string'
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
      return response.api(400, null, validation.messages());
    }
    const t = new CaptureEndpoint;
    t.name = request.input('name');
    t.mapping = request.input('mapping');
    t.type = request.all().type;
    t.hash = md5(`${t.name}${Math.random()}`);
    t.tags = [];
    const tags = request.input('tags');
    if (null !== tags && tags.length > 0) {
      if (tags.includes(',')) {
        t.tags = tags.split(',');
      } else {
        t.tags = [tags];
      }
    }
    t.autoexports = request.input('autoexports');
    try {
      await t.save();
      response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{
        message: error.toString()
      }]);
    }
  }

  /**
   * Create/save a new captureendpoint.
   * POST captureendpoints
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({
    request,
    response
  }) {}

  async show({
    params,
    request,
    response,
    view
  }) {
    try {
      const template = await CaptureEndpoint.findOrFail(params.id);
      return response.api(200, template);
    } catch (error) {
      return response.api(400, null, [{
        message: error.toString()
      }]);
    }
  }

  async update({
    params,
    request,
    response
  }) {
    const rules = {
      name: `required|string|unique:capture_endpoints,name,id,${params.id}`,
      mapping: 'required',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
      return response.api(400, null, validation.messages());
    }
    try {
      const t = await CaptureEndpoint.findOrFail(params.id);
      t.name = request.input('name');
      t.mapping = request.input('mapping');
      t.tags = [];
      const tags = request.input('tags');
      if (null !== tags && tags.length > 0) {
        if (tags.includes(',')) {
          t.tags = tags.split(',');
        } else {
          t.tags = [tags];
        }
      }
      t.autoexports = request.input('autoexports');
      await t.save();
      return response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{
        message: error.toString()
      }]);
    }
  }

  /**
   * Delete a captureendpoint with id.
   * DELETE captureendpoints/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({
    params,
    request,
    response
  }) {}

  /**
   * 1. Look up the capture endpoint by its hash
   * 2. Validate the input
   * 3. Format the lead for ElasticSearch
   * 4. Check for Duplicate
   * 5. Save lead to Elasticsearch
   * 6. Send Socket.io Update on Lead Capture
   * 7. Register Lead w/ Export APIs
   */
  async captureLeadPages({
    params,
    request,
    response
  }) {
    let e;
    try {
      e = await CaptureEndpoint.query().where('hash', params.hash).first();
      if (!e) {
        return response.api(404, null, [{
          message: 'No such endpoint'
        }]);
      }
    } catch (error) {
      return response.api(500, null, [{
        message: error.toString()
      }]);
    }
    const rules = {
      email: 'required_when:phone,null|email',
      phone: 'required_when:email,null|string',
    };
    for (let key in e.mapping) {
      if ('undefined' === typeof (rules[key])) {
        switch (e.mapping[key].type) {
          case 'boolean':
            rules[key] = 'boolean';
            break;

          default:
            rules[key] = 'string';
            break;
        }
      }
    }
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
      return response.api(200, request.all(), validation.messages());
    }
    response.api(201, request.all());
    const lead = await this.formatLeadForElasticSearch(request.all(), e.mapping, e.tags, e.autoexports);
    this.notifyOnCapture(e, request.all());
  }

  async formatLeadForElasticSearch(lead, mapping, tags, autoexports) {
    const importer = use('importer');
    const row = new Map();
    const columnSettings = {};
    let index = 0;
    for (let field in mapping) {
      row.set(index, ('undefined' === typeof (lead[field])) ? null : lead[field]);
      columnSettings[`${index}`] = {
        type: mapping[field].type,
        name: mapping[field].leadfield,
        options: {
          default: (null === mapping[field].default) ? '' : mapping[field].default,
        },
      }
      index++;
    }
    const map = await importer.makeLeadMapFromMap(row, columnSettings)
    try {
      let lead = await importer.makeElasticsearchLeadMapFromMap(map, {
        column_settings: columnSettings,
        tags: tags.join(','),
      });
      /**
       * Apply pre-duplicate check post-processing fixes
       */
      lead = await importer.applyPostProcessingFixesToLeadMap(lead, columnSettings);
      /**
       * Check that we have at least a valid email or phone. If not, fail the lead
       */
      if (!lead.has('email') && !lead.has('phone')) {
        // invalid lead
      } else {
        /**
         * Apply duplicate check merge
         */
        let saveId;
        let deleteId;
        const duplicateIds = await importer.getExistingLeadId(lead);
        if ('string' === typeof (duplicateIds) || 'object' === typeof (duplicateIds)) {
          switch (typeof (duplicateIds)) {
            case 'object':
              saveId = duplicateIds.phone;
              if (duplicateIds.phone !== duplicateIds.email) {
                lead = await importer.mergeLeadDetails(lead, duplicateIds.email);
                lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
                deleteId = duplicateIds.email;
              } else {
                lead = await importer.mergeLeadDetails(lead, duplicateIds.phone);
              }
              break;

            case 'string':
              lead = await importer.mergeLeadDetails(lead, duplicateIds);
              saveId = duplicateIds;
              break;
          }
        }
        /**
         * Apply post-duplicate check post-processing fixes
         */
        lead = await importer.applyPostProcessingFixesToLeadMap(lead, columnSettings);
        /**
         * Save lead to ElasticSearch, Update Redis Cache & Delete Duplicate Leads
         */
        const { final, id } = await importer.saveLeadToElasticsearch(lead, saveId, deleteId);
        if ('object' === typeof(final) && null !== final && Array.isArray(autoexports) && autoexports.length > 0) {
          const ExportApi = use('App/Models/ExportApi');
          const LeadController = require('./LeadController');
          const LeadControllerInstance = new LeadController;
          const Config = use('Config');
          for (let aei = 0; aei < autoexports.length; aei++) {
            const ae = autoexports[aei];
            try {
              const api = await ExportApi.findOrFail(ae);
              let service;
              switch (api.service) {
                case 'test':
                  service = use('ExportApi/Test');
                  break;

                case 'panda':
                  service = use('ExportApi/Panda');
                  break;

                default:
                  console.log(`Unknown API service ${api.service}`);
                  e.status = 'failed';
                  await e.save();
                  process.exit();
              }
              const array = await LeadControllerInstance.makearrayFromElasticsearchLeadList(Config.get(`exportapis.${api.service}.defaultMapping`), [{
                _index: 'leads',
                _id: id,
                _source: final,
                found: true,
              }], 'api');
              const a = new service(api);
              await a.exportLeads(
                array, // array of leads to import
                async (lead) => {    // on update
                  console.log(`Lead ${JSON.stringify(lead)} exported to API: ${api.name}`);
                },
                async (lead, error) => { // on lead error
                  console.log(`Lead ${JSON.stringify(lead)} failed to export to API: ${api.name}`);
                  console.warn(error);
                },
                async (error) => { // on failure
                  console.warn(error);
                },
                () => { }
              )
            } catch (error) {
              console.warn(error);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Lead Processing Error: ${error.toString()}`);
      console.warn(map);
      console.warn(error);
    }
  }

  async notifyOnCapture(endpoint, request) {
    const params = {
      title: ('leadpages' === endpoint.type) ? 'LeadPages Lead Captured' : 'Lead Captured',
      body: null,
    }
    if ('undefined' !== typeof (request.email) && 'undefined' !== typeof (request.phone)) {
      params.body = `A lead with email ${request.email} and phone ${request.phone} was captured by the endpoint ${endpoint.name}`;
    }
    if ('undefined' !== typeof (request.email) && 'undefined' === typeof (request.phone)) {
      params.body = `A lead with email ${request.email} was captured by the endpoint ${endpoint.name}`;
    }
    if ('undefined' === typeof (request.email) && 'undefined' !== typeof (request.phone)) {
      params.body = `A lead with phone ${request.email} was captured by the endpoint ${endpoint.name}`;
    }
    const Notifier = use('Notifier');
    Notifier.notify(params.title, params.body, 'success');
  }
}

module.exports = CaptureEndpointController
