'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    atompark: {
        name: 'AtomPark',
        config: {
            url: 'url',
            public_key: 'text',
            private_key: 'text',
        },
    },
    twilio: {
        name: 'Twilio',
        config: {
            sid: 'text',
            token: 'text',
            sender_alpha: 'text',
            sender_phone: 'text',
        },
    },
    // deliverhub: {
    //     name: 'DeliverHub',
    //     config: {
    //         userID: 'text',
    //         password: 'text',
    //     },
    // }
}
