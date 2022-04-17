'use strict'

class Notifier {
    constructor () {
        this.pushHandler = require('../../app/Services/push');
        this.socket = require('../../app/Controllers/Ws/socket.io');
    }

    async emit(event, data) {
        if ('function' === typeof(this.socket.emit)) {
            this.socket.emit(event, data);
        }
    }

    async push(title, body) {
        this.pushHandler.push(title, {
            body
        });
    }

    async notify(title, body, type) {
        if ('undefined' === typeof(type)) {
            type = 'info';
        }
        this.push(title, body);
        this.emit('notification', {
            title,
            body,
            type,
        });
    }
}

module.exports = Notifier;