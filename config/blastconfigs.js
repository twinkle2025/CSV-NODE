'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    sms: {
        name: 'SMS',
        config: {
            provider: null,
            subject: '',
            body: '',
            manual_recipients: '',
            recipient_query: {
                usesAdvancedQuery: false,
                search: '',
                searchQuery: '',
            },
            send_at: {
                time: null,
                local: false,
            }
        },
    }
}
