'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class chunkedProcessor {
    constructor(obj, size, fn, cb, start) {
        this.obj = obj;
        this.size = size;
        this.fn = fn;
        this.cb = cb;
        this.iterator = this.obj.entries();
        if(start) {
            while(start > 0) {
                this.iterator.next();
                --start;
            }
        }
    }

    async process() {
        let promiseBucket = this._fillPromiseBucket();
        if (promiseBucket.length > 0) {
            await Promise.all(promiseBucket);
            if ('function' === typeof(this.cb)) {
                await this.cb();
            }
            await this.process();
        }
    }

    _fillPromiseBucket() {
        const ret = [];
        for (let i = 0; i < this.size; i++) {
            const value = this.iterator.next().value;
            if (value) {
                ret.push(this.fn({
                    key: value[0],
                    value: value[1]
                }));
            }
        }
        return ret;
    }
}

const chunkedForEach = (obj, size, fn, cb, start) => {
    const cp = new chunkedProcessor(obj, size, fn, cb, start);
    return cp.process();
}

class chunkedForEachProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('chunkedForEach', () => {
      return chunkedForEach;
    });
  }
}

module.exports = chunkedForEachProvider
