'use strict'

const CaptureEndpoint = use('App/Models/CaptureEndpoint');
const { validate, sanitize, sanitizor } = use('Validator');
require('newrelic');

class TwilioEndpointController {
    async index({
    request,
    response,
  }) {
    const type = 'twilio'
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
    t.type = 'twilio';
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

  async handleIncoming({request, response, params}) {
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
        From: 'required|string',
        To: 'required|string',
    };
    const validation = await validate(request.all(), rules);
    if (validation.fails()) {
      return response.api(400, request.all(), validation.messages());
    }
    const req = sanitize(request.all(), {
        From: 'phoneNumber',
        To: 'phoneNumber',
    });
    /**
     * check if we're valid or invalid
     */

    const EnqueuedMessage = use('App/Models/EnqueuedMessage');
    let count;
    let merge = {};
    let res = '';
    try {
        count = await EnqueuedMessage.query().where('destination', req.From).getCount();
    } catch (error) {
        return response.api(500, null, [{
            message: error.toString()
        }]);
    }
    if (count > 0) {
        const importer = use('importer');
        const info = importer._getPhoneInfoWithoutIso(req.From);
        const lead = await importer.getDuplicateId('phone', info.value, true, true);
        merge = {...lead, ...req}
        // we're working with valid!
        switch(params.type) {
            case 'sms':
                res = e.mapping.sms.valid;
                // just return twiML if we have
                break;

            case 'phone':
                const MessageBlast = use('App/Models/MessageBlast');
                const moment = require('moment');
                res = e.mapping.phone.valid;
                const msg = e.mapping.phone.validSMS;
                const blast = new MessageBlast;
                blast.name = `Response to Inbound Phone Call from ${req.From} at ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
                blast.service = 'sms';
                blast.configuration = {
                    provider: e.mapping.provider,
                    subject: req.To,
                    body: msg,
                    manual_recipients: req.From,
                    recipient_query: {
                        usesAdvancedQuery: false,
                        search: '',
                        searchQuery: '',
                    },
                    send_at: {
                        time: moment(),
                        local: false,
                    }
                }
                await blast.save();
                const messagequeue = use('messagequeue');
                messagequeue.enqueue(blast);
                break;
        }
    } else {
        // we're working with invalid
        merge = {...req};
        switch(params.type) {
            case 'sms':
                res = e.mapping.sms.invalid;
                // just return twiML if we have
                break;

            case 'phone':
                res = e.mapping.phone.invalid;
                // just return twiML if we have
                break;
        }
    }
    const Mustache = require('mustache');
    res = `${Mustache.render(res, merge)}`
    response.header('Content-type', 'text/xml');
    return response.send(res);
  }
}

module.exports = TwilioEndpointController
