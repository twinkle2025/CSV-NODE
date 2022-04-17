const Config = use('Config');
const { Client } = require('@elastic/elasticsearch')
const client = new Client(Config.get('elasticsearch'));
const sleep = use('sleep');
const Helpers = use('Helpers');

class ElasticSearchQueue {
    constructor(client) {
        this.client = client;
        this.inserts = new Set;
        this.updates = new Map;
        this.maxBeforeAutoProcess = Config.get('app.maxBeforeAutoDump', 100);
    }

    addInsert(lead) {
        if (typeof(process.send) === undefined || !Helpers.isAceCommand()) {
            this.inserts.add(lead);
            if (this._getSum() >= this.maxBeforeAutoProcess) {
                this.process();
            }
        }
        else {
            process.send({
                event: 'add-lead-insert',
                data: {lead: this._mapToObject(lead)}
            });
        }
    }

    addUpdate(lead, leadId) {
        if (typeof(process.send) === undefined || !Helpers.isAceCommand()) {
            if (leadId) {
                this.updates.set(leadId, lead);
            } else {
                this.inserts.add(lead);
            }
            if (this._getSum() >= this.maxBeforeAutoProcess) {
                this.process();
            }
        }
        else {
            process.send({
                event: 'add-lead-update',
                data: {lead: this._mapToObject(lead), leadId},
            });
        }
    }

    _getSum() {
        let sum = 0;
        sum += this.inserts.size;
        sum += this.updates.size;
        return sum;
    }

    _mapToObject(map) {
        let obj = Object.create(null);
        for (let [k,v] of map) {
            obj[k] = v;
        }
        return obj;
    }

    async process(loop) {
        const query = {
            index: 'leads',
            // refresh: true,
            body: '',
        }
        this.inserts.forEach((lead) => {
            query.body += JSON.stringify({
                index: {
                    _index: 'leads',
                }
            }) + "\n";
            query.body += JSON.stringify(lead) + "\n";
        });
        this.inserts.clear();
        this.updates.forEach((lead, leadId) => {
            query.body += JSON.stringify({
                update: {
                    _index: 'leads',
                    _id: leadId,
                }
            }) + "\n";
            query.body += JSON.stringify({doc: lead}) + "\n";
        });
        this.updates.clear();
        /**
         * If there is anything to update, push the update!
         */
        if (query.body.length > 0) {
            try {
                const {body} = await client.bulk(query);
                for (let i = 0; i < body.items.length; i++) {
                    const item = body.items[i];
                    if ('object' === typeof(item.update)) {
                        console.log(`Updated Lead:`, JSON.stringify(item.update));
                    }
                    else if ('object' === typeof(item.index)) {
                        console.log(`Created Lead:`, JSON.stringify(item.index));
                    }
                }
            }
            catch (error) {
                console.warn(error.meta.body);
            }
        }
        if (true === loop) {
            await sleep(500);
            return await this.process(loop);
        }
        return null;
    }
}

const queue = new ElasticSearchQueue(client);

module.exports = {
    client,
    queue
}