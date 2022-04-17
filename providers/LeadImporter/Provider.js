'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class LeadImporterProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('importer', () => {
        return new (require('.'));
    });
  }
}

module.exports = LeadImporterProvider