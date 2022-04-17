'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class MessageProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('messagequeue', () => {
        return new (require('.'));
    });
  }
}

module.exports = MessageProvider