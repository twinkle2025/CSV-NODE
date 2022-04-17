'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const Config = use('Config');

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle (error, ctx) {
        if (ctx.request.match('api/v1/(.*)') || ctx.request.match('conversions/report/(.*)')) {
            console.warn(error);
            return ctx.response.api(error.status, null, [{message: error.message}]);
        } else {
            return this._defaultHandler(error, ctx);
        }
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report (error, { request }) {
  }
}

module.exports = ExceptionHandler
