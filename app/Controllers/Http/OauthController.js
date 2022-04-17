'use strict'

const { validate } = use('Validator');
const Config = use('Config');
require('newrelic');

class OauthController {
    async generateOauthRedirectUrl({request, response}) {
        const rules = {
            service: 'required|string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        switch(request.input('service')) {
            case 'google':
                const {google} = require('googleapis');
                try {
                    const oauth2Client = new google.auth.OAuth2(
                        Config.get('oauth.google.client'),
                        Config.get('oauth.google.secret'),
                        this.makeRedirectForOauth('google')
                    );
                    const url = oauth2Client.generateAuthUrl({
                        access_type: 'offline',
                        scope: Config.get('oauth.google.scopes'),
                        prompt: 'select_account',
                    });
                    return response.api(201, url);
                } catch (error) {
                    return response.api(500, null, [{message: error.toString()}]);
                }

            default:
                return response.api(400, null, [{message: 'Invalid OAuth Service'}]);
        }
        return response.api(503, null, [{message: "Debug"}]);
    }

    async handleGoogleOAuthCode({request, response}) {
        const {google} = require('googleapis');
        const rules = {
            code: 'required|string',
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.redirect('/bastion/#/transfer-from/google-drive');
        }
        const oauth2Client = new google.auth.OAuth2(
            Config.get('oauth.google.client'),
            Config.get('oauth.google.secret'),
            this.makeRedirectForOauth('google')
        );
        const code = request.input('code');
        try {
            const {tokens} = await oauth2Client.getToken(code);
            return response.redirect(`/bastion/#/transfer-from/google-drive?token=${JSON.stringify(tokens)}`);
        } catch (error) {
            return response.redirect('/bastion/#/transfer-from/google-drive');
        }
    }

    makeRedirectForOauth(service) {
        const Env = use('Env')
        return Env.get('APP_URL', `${Env.get('HOST', '127.0.0.1')}:${Env.get('PORT', 3333)}`) + `/oauth/${service}`;
    }
}

module.exports = OauthController
