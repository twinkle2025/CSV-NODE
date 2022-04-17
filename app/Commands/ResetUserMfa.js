'use strict'

const { Command } = require('@adonisjs/ace')

class ResetUserMfa extends Command {
  static get signature () {
    return `user:reset:mfa
    { username : The username of the user }`
  }

  static get description () {
    return 'Reset a User\'s MFA'
  }

  async handle (args, options) {
    const User = use('App/Models/User');
    this.info(`Finding user with username "${args.username}".`);
    try {
      const user = await User.query().where('username', '=', args.username.toLowerCase()).first();
      user.authenticator_secret = null;
      await user.save();
      this.info(`Reset MFA token for "${args.username}".`);
    } catch (error) {
      console.warn(error);
      this.info(`Failed to reset MFA for "${args.username}".`);
    }
    process.exit(0);
  }
}

module.exports = ResetUserMfa
