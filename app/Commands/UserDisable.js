'use strict'

const { Command } = require('@adonisjs/ace')

class UserDisable extends Command {
  static get signature () {
    return `user:disable
    { username : The username of the user }`
  }

  static get description () {
    return 'Disable a user from accessing the dashboard'
  }

  async handle (args, options) {
    const User = use('App/Models/User');
    this.info(`Finding user with username "${args.username}".`);
    try {
      const user = await User.query().where('username', '=', args.username.toLowerCase()).first();
      user.active = false;
      await user.save();
      this.info(`"${args.username}" disabled.`);
    } catch (error) {
      console.warn(error);
      this.info(`Failed to disable "${args.username}".`);
    }
    process.exit(0);
  }
}

module.exports = UserDisable
