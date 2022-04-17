'use strict'

const { Command } = require('@adonisjs/ace')

class Push extends Command {
  static get signature () {
    return `
      push
      { title : The title of the push notification }
      { body? : The body of the push notification }
    `;
  }

  static get description () {
    return 'Send a push notification'
  }

  async handle (args) {
    const PushController = require('../Controllers/Http/PushController');
    const PushControllerInstance = new PushController;
    const payload = (args.body) ? {body: args.body} : {};
    await PushControllerInstance.sendPush(args.title, payload);
    process.exit(0);
  }
}

module.exports = Push
