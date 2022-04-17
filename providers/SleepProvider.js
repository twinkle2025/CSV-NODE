'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

const sleep = (ms) => {
  return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      },ms)
  })
}

class SleepProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('sleep', () => {
      return sleep;
    });
  }
}

module.exports = SleepProvider
