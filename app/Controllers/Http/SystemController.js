'use strict'

require('newrelic');

class SystemController {
    async viewHandler({auth, session, view}) {
        const middlwareVars = await this.getMiddlewareVars(auth, session);
        if (! middlwareVars.logged_in) {
            return view.render('login');
        }
        else if (middlwareVars.requires_mfa) {
            return view.render('mfa');
        }
        else if (middlwareVars.requires_mfa_secret) {
            return view.render('setmfa');
        }
        else {
            return view.render('welcome');
        }
    }

    async pwaHandler({view}) {
        return view.render('pwa');
    }

    async privacyHandler({view}) {
        return view.render('privacy');
    }

    async ping({response, auth, session}) {
        return response.api(200, 'Pong');
    }

    async middleware({response, auth, session}) {
        const body = await this.getMiddlewareVars(auth, session);
        return response.api(200, body);
    }

    async endpointNotFound({response}) {
        return response.api(404, null, [{
            message: "No such Endpoint"
        }]);
    }

    async getMiddlewareVars(auth, session) {
        try {
            const user = await auth.getUser();
            const hasValidatedMFA = session.get('hasValidatedMFA');
            return {
                user,
                logged_in: true,
                requires_mfa: !(user.authenticator_secret === null || hasValidatedMFA === true),
                requires_mfa_secret: (user.authenticator_secret === null),
            }
        } catch (error) {
            return {
                user: null,
                logged_in: false,
                requires_mfa: false,
                requires_mfa_secret: false,
            }
        }
    }

    async getLeadMapping({response}) {
        const {client} = require('../../Services/elasticsearch');
        const doNotAddkeys = ['conversions', 'lead_conversions'];
        try {
            const results = await client.indices.getMapping({
                index: 'leads',
            });
            const fields = {
                _id: 'text',
            };
            for (let key in results.body.leads.mappings.properties) {
                if (doNotAddkeys.indexOf(key) === -1) {
                    const field = results.body.leads.mappings.properties[key];
                    if ('undefined' === typeof(field.properties)) {
                        fields[key] = field.type;
                    } else {
                        for (let prop in field.properties) {
                            const property = field.properties[prop];
                            const fk = `${key}.${[prop]}`;
                            fields[fk] = property.type;
                        }
                    }
                }
            }
            delete fields.conversions;
            delete fields.lead_conversions;
            return response.api(200, fields);
        } catch (error) {
            console.warn(JSON.stringify(error, null, 2));
            return response.api(500, null, [{message: error.toString()}]);
        }

        return response.api(503, null, [{message: "Debug"}]);
    }

    async renderSPAManifest({request, response}) {
        const Env = use('Env')
        const manifest = {
            short_name: 'Bastion',
            name: 'JVBastion Data Warehouse',
            theme_color: '#273246',
            background_color: '#fff',
            orientation: "portrait",
            display: 'standalone',
            start_url: Env.get('APP_URL', `${Env.get('HOST', '127.0.0.1')}:${Env.get('PORT', 3333)}`) + '/',
            icons: [
                {
                    src: "assets/images/android-icon-36x36.png",
                    type: "image/png",
                    sizes: "36x36"
                },
                {
                    src: "assets/images/android-icon-48x48.png",
                    type: "image/png",
                    sizes: "48x48"
                },
                {
                    src: "assets/images/android-icon-72x72.png",
                    type: "image/png",
                    sizes: "72x72"
                },
                {
                    src: "assets/images/android-icon-96x96.png",
                    type: "image/png",
                    sizes: "96x96"
                },
                {
                    src: "assets/images/android-icon-144x144.png",
                    type: "image/png",
                    sizes: "144x144"
                },
                {
                    src: "assets/images/android-icon-192x192.png",
                    type: "image/png",
                    sizes: "192x192"
                },
                {
                    src: "assets/images/apple-icon-57x57.png",
                    type: "image/png",
                    sizes: "57x57"
                },
                {
                    src: "assets/images/apple-icon-76x76.png",
                    type: "image/png",
                    sizes: "76x76"
                },
                {
                    src: "assets/images/apple-icon-114x114.png",
                    type: "image/png",
                    sizes: "114x114"
                },
                {
                    src: "assets/images/apple-icon-120x120.png",
                    type: "image/png",
                    sizes: "120x120"
                },
                {
                    src: "assets/images/apple-icon-152x152.png",
                    type: "image/png",
                    sizes: "152x152"
                },
                {
                    src: "assets/images/apple-icon-180x180.png",
                    type: "image/png",
                    sizes: "180x180"
                },
            ],
        };

        return response.json(manifest);
    }

    async generateMFASecret({response}) {
        const speakeasy = require('speakeasy');
        const qrcode = require('qrcode');
        try {
            const secret = speakeasy.generateSecret();
            const url = await qrcode.toDataURL(secret.otpauth_url);
            return response.api(201, {
                secret: secret.base32,
                url
            });
        } catch (error) {
            return response.api(500, null, [{message: error.toString()}]);    
        }
        return response.api(503, null, [{message: "Debug"}]);
    }

    async saveMFASecret({response, request, auth}) {
        const speakeasy = require('speakeasy');
        const valid = speakeasy.totp.verify({ secret: request.input('totp_secret'),
            encoding: 'base32',
            token: request.input('totp_code') });
        if (!valid) {
            return response.api(400, null, [{message: 'TOTP Code does not match secret'}]);
        }
        try {
            const user = await auth.getUser();
            user.authenticator_secret = request.input('totp_secret');
            await user.save();
            return response.api(201);
        }
        catch (error) {
            return response.api(500, null, [{message: error.toString()}]);    
        }
        return response.api(503, null, [{message: JSON.stringify(request.all())}]);
    }

    async verifyMFA({response, request, auth, session}) {
        const speakeasy = require('speakeasy');
        let user;
        try {
            user = await auth.getUser();
        }
        catch (error) {
            return response.api(500, null, [{message: error.toString()}]);    
        }
        const valid = speakeasy.totp.verify({ secret: user.authenticator_secret,
            encoding: 'base32',
            token: request.input('totp_code') });
        if (!valid) {
            return response.api(400, null, [{message: 'Invalid TOTP Code'}]);
        }
        try {
            session.put('hasValidatedMFA', true);
        }
        catch (error) {
            return response.api(500, null, [{message: error.toString()}]);    
        }
        return response.api(200);
    }
}

module.exports = SystemController
