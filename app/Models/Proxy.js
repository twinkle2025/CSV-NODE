'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Proxy extends Model {
    static boot () {
        super.boot()

        this.addHook('beforeSave', async (item) => {
            if (item.dirty.active && item.active == false) {
                const io = require('../Controllers/Ws/socket.io');
                io.emit('disabled-proxy', {item});
            }
        })

        this.addHook('afterSave', async (item) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('proxy', {item});
        });
    }

    account () {
        return this.belongsTo('App/Models/EmailAccount', 'email_account_id', 'id');
    }

    emails () {
        return this.hasMany('App/Models/EnqueuedEmail');
    }
}

module.exports = Proxy
