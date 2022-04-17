'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    gcm: {
        key: Env.get('GCM_API_KEY')
    },
    vapid: {
        email: Env.get('VAPID_EMAIL'),
        publicKey: Env.get('VAPID_PUBLIC'),
        privateKey: Env.get('VALID_PRIVATE')
    }
}
