'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const EmailAccount = use('App/Models/EmailAccount');
const Proxy = use('App/Models/Proxy');
const { validate } = use('Validator');
const Config = use('Config');
require('newrelic');

/**
 * Resourceful controller for interacting with emailaccounts
 */
class EmailAccountController {
  /**
   * Show a list of all emailaccounts.
   * GET emailaccounts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = EmailAccount.query().with('proxy')
    if ('object' === typeof(request.input('search')) && null !== request.input('search')) {
        const search = request.input('search');
        if ('undefined' !== typeof(search.value) && search.value.length > 0) {
          query.where('host', 'like', `%${search.value}%`);
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
        rows.push([
          row.id,
          row.email,
          row.host,
          row.port,
          row.user,
          row.encryption,
          row.max_hourly,
          row.max_daily,
          row.current_hourly,
          row.current_daily,
          row.active,
          row.getRelated('proxy'),
        ]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  async all({response, request}) {
    const query = EmailAccount.query().doesntHave('proxy');
    try {
        const results = await query.fetch();
        return response.api(200, results.rows);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to be used for creating a new proxy.
   * GET emailaccounts/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
    const rules = {
      email: 'required|email',
      name: 'string',
      host: 'required|string',
      port: 'required|integer',
      user: 'string',
      password: 'string',
      encryption: 'required|string|in:none,ssl,tls',
      max_hourly: 'required|integer',
      max_daily: 'required|integer',
      active: 'boolean',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    const t = new EmailAccount;
    t.email = request.input('email').toLowerCase();
    t.name = request.input('name');
    t.host = request.input('host').toLowerCase();
    t.port = parseInt(request.input('port'));
    t.user = request.input('user');
    t.password = request.input('password');
    t.encryption = request.input('encryption').toLowerCase();
    t.max_hourly = parseInt(request.input('max_hourly'));
    t.max_daily = parseInt(request.input('max_daily'));
    t.current_hourly = 0;
    t.current_daily = 0;
    t.active = (true == request.input('active'));
    try {
      await t.save();
      response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Create/save a new proxy.
   * POST emailaccounts
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single proxy.
   * GET emailaccounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    try {
      const template = await EmailAccount.findOrFail(params.id);
      await template.load('proxy');
      return response.api(200, template);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to update an existing proxy.
   * GET emailaccounts/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update proxy details.
   * PUT or PATCH emailaccounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const rules = {
      email: 'required|email',
      name: 'string',
      host: 'required|string',
      port: 'required|integer',
      user: 'string',
      password: 'string',
      encryption: 'required|string|in:none,ssl,tls',
      max_hourly: 'required|integer',
      max_daily: 'required|integer',
      active: 'boolean',
      proxy_id: 'integer',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    try {
      const t = await EmailAccount.findOrFail(params.id);
      t.load('proxy');
      t.email = request.input('email').toLowerCase();
      t.name = request.input('name');
      t.host = request.input('host').toLowerCase();
      t.port = parseInt(request.input('port'));
      t.user = request.input('user');
      t.password = request.input('password');
      t.encryption = request.input('encryption').toLowerCase();
      t.max_hourly = parseInt(request.input('max_hourly'));
      t.max_daily = parseInt(request.input('max_daily'));
      t.current_hourly = 0;
      t.current_daily = 0;
      t.active = (true == request.input('active'));
      await t.save();
      const oldproxy = t.getRelated('proxy');
      if ('object' === typeof(oldproxy) && null !== oldproxy) {
        await oldproxy.account().dissociate();
      }
      if (parseInt(request.input('proxy_id')) > 0) {
        const proxy = await Proxy.findOrFail(parseInt(request.input('proxy_id')));
        await proxy.account().associate(t);
      }
      return response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Delete a proxy with id.
   * DELETE emailaccounts/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = EmailAccountController
