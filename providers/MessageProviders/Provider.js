'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ExportApisProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('message/atompark', () => {
        return require('./atompark');
    });
    this.app.singleton('message/twilio', () => {
      return require('./twilio');
    });
    this.app.singleton('message/deliverhub', () => {
      return require('./deliverhub');
    });
  }
}

module.exports = ExportApisProvider