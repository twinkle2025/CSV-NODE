'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const moment = require('moment-timezone');

class processReporter {
    constructor() {
        this.notifier = use('Notifier');
        this.lastMinute = [];
        this.count = 0;
        while (this.lastMinute.length < 60) {
            this.lastMinute.push([
                this.count,
                moment().valueOf()
            ]);
        }
        this.interval = setInterval(() => {
            this._updateLastMinuteGraph();
        }, 1000);
    }

    _updateLastMinuteGraph() {
        this.lastMinute.shift();
        this.lastMinute.push([
            this.count,
            moment().valueOf()
        ]);
        // this.notifier.emit('processed-rows', this.count);
        this.notifier.emit('imports-this-second', this.count);
        this.count = 0;
    }

    record() {
        this.count ++;
    }
}

class processingPerSecondProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('processorReporter', () => {
      return new processReporter();
    });
  }
}

module.exports = processingPerSecondProvider
