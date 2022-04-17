'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const EnqueuedEmail = use('App/Models/EnqueuedEmail');
const MessageBlast = use('App/Models/MessageBlast');
const { validate } = use('Validator');

/**
 * Resourceful controller for interacting with enqueuedemails
 */
class EnqueuedEmailController {
  /**
   * Show a list of all enqueuedemails.
   * GET enqueuedemails
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = EnqueuedEmail.query().with('account').with('proxy')
    if ('object' === typeof(request.input('search')) && null !== request.input('search')) {
        const search = request.input('search');
        if ('undefined' !== typeof(search.value) && search.value.length > 0) {
          query.where('to_email', 'like', `%${search.value}%`);
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
        const proxy = row.getRelated('proxy');
        rows.push([
          row.id,
          row.status,
          row.to_email,
          row.to_name,
          row.lead_id,
          row.subject,
          row.started,
          account,
          proxy,
          row.failed_proxy,
          row.failed_email_account,
          row.failed_spam,
          row.failed_other,
        ]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  /**
   * Render a form to be used for creating a new enqueuedemail.
   * GET enqueuedemails/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
    const rules = {
      name: 'required|string|unique:sms_providers,name',
      configuration: 'required',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
        return response.api(400, null, validation.messages());
    }
    const t = new MessageBlast;
    t.name = request.input('name');
    t.service = 'email';
    t.configuration = request.input('configuration');
    try {
      await t.save();
      response.api(201, t);
    } catch (error) {
      return response.api(400, null, [{message: error.toString()}]);
    }
    /**
     * Now we need to enqueue some messages to send!
     */
    const messagequeue = use('messagequeue');
    messagequeue.enqueue(t);
  }

  /**
   * Create/save a new enqueuedemail.
   * POST enqueuedemails
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single enqueuedemail.
   * GET enqueuedemails/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Render a form to update an existing enqueuedemail.
   * GET enqueuedemails/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update enqueuedemail details.
   * PUT or PATCH enqueuedemails/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a enqueuedemail with id.
   * DELETE enqueuedemails/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = EnqueuedEmailController
