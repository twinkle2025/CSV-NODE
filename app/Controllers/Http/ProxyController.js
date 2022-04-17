'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Proxy = use('App/Models/Proxy');
const { validate } = use('Validator');
const Config = use('Config');
const EmailAccount = use('App/Models/EmailAccount');

require('newrelic');

/**
 * Resourceful controller for interacting with proxies
 */
class ProxyController {
  /**
   * Show a list of all proxies.
   * GET proxies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = Proxy.query().with('account')
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
        const account = row.getRelated('account');
        rows.push([row.id, row.active, row.type, row.host, row.port, account]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  async all({response, request}) {
    const query = Proxy.query().doesntHave('account');
    try {
        const results = await query.fetch();
        return response.api(200, results.rows);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to be used for creating a new proxy.
   * GET proxies/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
    const rules = {
        type: 'required|string|in:http,socks4,socks5',
        host: 'required|string',
        port: 'required|integer',
        active: 'required|boolean',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    const t = new Proxy;
    t.type = request.input('type').toLowerCase();
    t.host = request.input('host').toLowerCase();
    t.port = parseInt(request.input('port'));
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
   * POST proxies
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single proxy.
   * GET proxies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
    try {
      const template = await Proxy.findOrFail(params.id);
      await template.load('account');
      return response.api(200, template);
    } catch (error) {
        return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Render a form to update an existing proxy.
   * GET proxies/:id/edit
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
   * PUT or PATCH proxies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const rules = {
      type: 'required|string|in:http,socks4,socks5',
        host: 'required|string',
        port: 'required|integer',
        active: 'boolean',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    try {
      const t = await Proxy.findOrFail(params.id);
      t.load('account');
      t.type = request.input('type').toLowerCase();
      t.host = request.input('host').toLowerCase();
      t.port = parseInt(request.input('port'));
      t.active = (true == request.input('active'));
      await t.save();
      t.account().dissociate();
      if (parseInt(request.input('account_id')) > 0) {
        const account = await EmailAccount.findOrFail(parseInt(request.input('account_id')));
        await t.account().associate(account);
      }
      return response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
  }

  /**
   * Delete a proxy with id.
   * DELETE proxies/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = ProxyController
