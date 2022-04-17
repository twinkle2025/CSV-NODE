'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserPushSubscription extends Model {
    static boot () {
        super.boot()
    
        this.addHook('beforeSave', async (item) => {
            if (item.dirty.subscription) {
                item.subscription = JSON.stringify(item.subscription);
            }
        });
    
        this.addHook('afterSave', async (item) => {
            if ('string' === typeof(item.subscription)) {
                item.subscription = JSON.parse(item.subscription);
            }
        });
    
        this.addHook('afterFind', async (item) => {
            if ('string' === typeof(item.subscription)) {
                item.subscription = JSON.parse(item.subscription);
            }
        });
    
        this.addHook('afterFetch', async items => {
            for (let item of items) {
                if ('string' === typeof(item.subscription)) {
                    item.subscription = JSON.parse(item.subscription);
                }
            }
          })
      }
}

module.exports = UserPushSubscription
