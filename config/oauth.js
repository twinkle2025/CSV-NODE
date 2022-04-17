'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    //node: Env.get('ES_HOST', 'http://localhost:9200'),
    google: {
        client: Env.get('GOOGLE_OAUTH_CLIENT_ID', null),
        secret: Env.get('GOOGLE_OAUTH_CLIENT_SECRET', null),
        scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/drive.file'
        ],
    }
}
