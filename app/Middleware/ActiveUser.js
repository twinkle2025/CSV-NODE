'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class ActiveUser {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {
    try {
      const user = await auth.getUser();
      if (!user.active) {
        await auth.logout();
          session.put('hasValidatedMFA', false);
        if (ctx.request.match('api/v1/(.*)')) {
            return ctx.response.api(401, null, [{message: 'You are not logged in'}]);
        }
        else {
            return response.redirect('/');
        }
      }
    } catch (error) {
        
    }
    await next();
  }
}

module.exports = ActiveUser
