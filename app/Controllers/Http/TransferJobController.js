'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const TransferJob = use('App/Models/TransferJob');
require('newrelic');

/**
 * Resourceful controller for interacting with transferjobs
 */
class TransferJobController {
  /**
   * Show a list of all transferjobs.
   * GET transferjobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
    const query = TransferJob.query()
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
        rows.push([row.id, row.service, row.name, row.status, row.imported_bytes, row.created_at]);
    }
    return response.datatable(200, request.input('draw'), rows, paginatedResults.pages.total, paginatedResults.rows.length);
  }

  /**
   * Render a form to be used for creating a new transferjob.
   * GET transferjobs/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create ({ request, response, view }) {
  }

  /**
   * Create/save a new transferjob.
   * POST transferjobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
  }

  /**
   * Display a single transferjob.
   * GET transferjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Render a form to update an existing transferjob.
   * GET transferjobs/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit ({ params, request, response, view }) {
  }

  /**
   * Update transferjob details.
   * PUT or PATCH transferjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a transferjob with id.
   * DELETE transferjobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = TransferJobController
