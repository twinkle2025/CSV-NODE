'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EnqueuedEmail extends Model {
    static boot () {
        super.boot()

        this.addHook('afterSave', async (item) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('email-message', {item});
        });
    }

    account () {
        return this.belongsTo('App/Models/EmailAccount', 'email_account_id', 'id');
    }

    proxy () {
        return this.belongsTo('App/Models/Proxy', 'proxy_id', 'id');
    }
}

module.exports = EnqueuedEmail
