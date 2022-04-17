'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const ExportTemplate = use('App/Models/ExportTemplate');
const { validate } = use('Validator');
require('newrelic');

/**
 * Resourceful controller for interacting with exporttemplates
 */
class ExportTemplateController {
  /**
   * Show a list of all exporttemplates.
   * GET exporttemplates
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = ExportTemplate.query()
    if ('object' === typeof(request.input('search')) && null !== request.input('search')) {
        const search = request.input('search');
        if ('undefined' !== typeof(search.value) && search.value.length > 0) {
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
    if ('undefined' === typeof(start) || null === start || parseInt(start) < 0) {
        start = 0;
    }
    if ('undefined' === typeof(length) || null === length || parseInt(length) < 10) {
        length = 10;
    }
    start ++;
    const startPage = Math.ceil(start / length);
    const paginatedResults = await query.paginate(startPage, length);
    const rows = [];
    for (let i = 0; i < paginatedResults.rows.length; i++) {
        const row = paginatedResults.rows[i];
        rows.push([row.id, row.name]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  async all({response, request}) {
    const query = ExportTemplate.query();
    try {
        const results = await query.fetch();
        return response.api(200, results.rows);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to be used for creating a new exporttemplate.
   * GET exporttemplates/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
    const rules = {
        name: 'required|string|unique:export_templates,name',
        columns: 'required',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    const t = new ExportTemplate;
    t.name = request.input('name');
    t.export_columns = request.input('columns');
    try {
      await t.save();
      response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Create/save a new exporttemplate.
   * POST exporttemplates
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single exporttemplate.
   * GET exporttemplates/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, response }) {
    try {
        const template = await ExportTemplate.findOrFail(params.id);
        return response.api(200, template);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to update an existing exporttemplate.
   * GET exporttemplates/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update exporttemplate details.
   * PUT or PATCH exporttemplates/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const rules = {
        name: `required|string|unique:export_templates,name,id,${params.id}`,
        columns: 'required',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    try {
      const t = await ExportTemplate.findOrFail(params.id);
      t.name = request.input('name');
      t.export_columns = request.input('columns');
      await t.save();
      return response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Delete a exporttemplate with id.
   * DELETE exporttemplates/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = ExportTemplateController
