'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class File extends Model {
    setting () {
        return this.hasOne('App/Models/ImportSetting')
    }

    jobs () {
        return this.hasMany('App/Models/ImportJob');
    }
}

module.exports = File
