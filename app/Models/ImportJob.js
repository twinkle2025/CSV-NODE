'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ImportJob extends Model {
    static boot () {
        super.boot()
        this.addHook('afterSave', async (job) => {
            const io = require('../Controllers/Ws/socket.io');
            io.emit('job', {job});
        });
    }


    file () {
        return this.belongsTo('App/Models/File')
    }
}

module.exports = ImportJob
