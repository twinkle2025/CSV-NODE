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
    this.app.singleton('Notifier', () => {
        return new (require('.'))
    });
  }
}

module.exports = ExportApisProvider