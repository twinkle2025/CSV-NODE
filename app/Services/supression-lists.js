class SupressionLists {
    constructor() {
        this.emails = new Set();
        this.domains = new Set();
        this.redis = use('Redis');
        this.retrieveListsFromRedis();
    }

    async retrieveListsFromRedis() {
        const redisEmails = await this.redis.get('suppressed_emails');
        const redisDomains = await this.redis.get('supressed_domains');
        if (redisEmails instanceof Set) {
            this.emails = redisEmails;
        }
        if (redisDomains instanceof Set) {
            this.domains = redisDomains;
        }
    }

    async storeListsToRedis() {
        const promises = [];
        promises.push(this.redis.set('suppressed_emails', this.emails));
        promises.push(this.redis.set('supressed_domains', this.domains));
        return await Promise.all(promises);
    }
}

const sl = new SupressionLists;

module.exports = sl;