'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EmailAccount extends Model {
    static boot () {
        super.boot()

        this.addHook('beforeSave', async (item) => {
            if (item.dirty.active && item.active == false) {
                const io = require('../Controllers/Ws/socket.io');
                io.emit('disabled-email-account', {item});
            }
        })

        this.addHook('afterSave', async (item) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('emailAccount', {item});
        });
    }

    proxy () {
        return this.hasOne('App/Models/Proxy', 'id', 'email_account_id');
    }

    emails () {
        return this.hasMany('App/Models/EnqueuedEmail');
    }
}

module.exports = EmailAccount
