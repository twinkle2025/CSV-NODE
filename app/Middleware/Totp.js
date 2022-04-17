'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Totp {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ auth, session }, next) {
    const SystemController = require('../Controllers/Http/SystemController');
    const SystemControllerInstance = new SystemController();
    const vars = await SystemControllerInstance.getMiddlewareVars(auth, session);
    if (vars.requires_mfa) {
      throw new Error('MFA Required');
    }
    else if (vars.requires_mfa_secret) {
      throw new Error('MFA Setup Required');
    }
    // call next to advance the request
    await next()
  }
}

module.exports = Totp
