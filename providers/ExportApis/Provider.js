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
    this.app.singleton('ExportApi/Test', () => {
        return require('./test');
    });
    this.app.singleton('ExportApi/Panda', () => {
        return require('./pandats');
    });
    this.app.singleton('ExportApi/Atompark', () => {
      return require('./atompark');
  });
  }
}

module.exports = ExportApisProvider