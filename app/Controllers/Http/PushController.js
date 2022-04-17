'use strict'

const webpush = require('web-push');
const Config = use('Config');
require('newrelic');

const UserPushSubscription = use('App/Models/UserPushSubscription');

class PushController {
    async init() {
        const pushConfig = Config.get('push');
        if (pushConfig.gcm.key) {
            webpush.setGCMAPIKey(pushConfig.gcm.key);
        }
        if (pushConfig.vapid.email && pushConfig.vapid.publicKey && pushConfig.vapid.privateKey) {
            webpush.setVapidDetails(`mailto:${pushConfig.vapid.email}`, pushConfig.vapid.publicKey, pushConfig.vapid.privateKey);
        }
    }

    async getVapidConfig({request, response, auth}) {
        const pushConfig = Config.get('push');
        if (pushConfig.vapid.email && pushConfig.vapid.publicKey && pushConfig.vapid.privateKey) {
            response.api(200, pushConfig.vapid.publicKey);
        }
        else {
            response.api(200, false);
        }
    }

    async subscribe({response, request}) {
        await this.init();
        const subscription = request.all();
        response.api(201, {});
        // find all subscriptions which match
        try {
            const count = await UserPushSubscription.query().where('subscription', JSON.stringify(subscription)).count();
            if ('undefined' === typeof(count) || 0 === count[0]['count(*)']) {
                const sub = new UserPushSubscription;
                sub.subscription = subscription;
                await sub.save();
                this.sendPushToSubscription(subscription, 'A Test Notification', {
                    body: 'Congratulations, you can now receive push notifications from Bastion',
                });
            } else {
                console.log(`Found ${count[0]['count(*)']} other subscriptions`);
            }
        } catch (error) {
            //console.warn(error);
        }
    }

    async sendPushToSubscription(subscription, title, options) {
        await this.init();
        const Env = use('Env')
        const baseUrl = Env.get('APP_URL', `${Env.get('HOST', '127.0.0.1')}:${Env.get('PORT', 3333)}`);
        options.icon = `${baseUrl}/assets/images/android-icon-48x48.png`;
        // for options, see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
        const payload = {
            title,
            options
        };
        try {
            return webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (error) {
            //console.error(error.stack);
            return error;
        }
    }

    async sendPush(title, options) {
        try {
            const subs = await UserPushSubscription.all();
            for (let i = 0; i < subs.rows.length; i++) {
                const sub = subs.rows[i];
                await this.sendPushToSubscription(sub.subscription, title, options);
            }
            return true;
        } catch (error) {
            //console.warn(error);
            return error;
        }
    }
}

module.exports = PushController
