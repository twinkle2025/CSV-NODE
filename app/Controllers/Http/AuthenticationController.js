'use strict'

const { validate } = use('Validator');
require('newrelic');

class AuthenticationController {
    async login({response, request, auth}) {
        let user;
        const rules = {
            email: 'required|email',
            password: 'required|string'
        };
        const validation = await validate(request.all(), rules);
        if (validation.fails()) {
            return response.api(400, null, validation.messages());
        }
        const { email, password } = request.all()
        try {
            const user = await auth.attempt(email, password);
            if (!user.active) {
                throw new Error('User is not active');
            }
            return response.api(200, user);
        } catch (error) {
            return response.api(400, null, [{
                message: "Invalid Login Credentials. Please check your credentials and try again",
            }]);
        }
    }

    async logout({response, request, auth, session}) {
        try {
            await auth.logout();
            session.put('hasValidatedMFA', false);
            return response.api(200);
        } catch (error) {
            return response.api(400, null, [{
                message: error.toString(),
            }]);
        }
    }

    async lock({response, request, auth, session}) {
        try {
            session.put('hasValidatedMFA', false);
            return response.api(200);
        } catch (error) {
            return response.api(400, null, [{
                message: error.toString(),
            }]);
        }
    }
}

module.exports = AuthenticationController
