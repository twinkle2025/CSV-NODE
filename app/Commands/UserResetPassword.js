'use strict'

const { Command } = require('@adonisjs/ace')

class UserResetPassword extends Command {
  static get signature () {
    return `user:reset:password
    { username : The username of the user }
    { password : The password to store on the user }`
  }

  static get description () {
    return 'Change a user\'s password'
  }

  async handle (args, options) {
    const User = use('App/Models/User');
    this.info(`Finding user with username "${args.username}".`);
    try {
      const user = await User.query().where('username', '=', args.username.toLowerCase()).first();
      user.password = args.password;
      await user.save();
      this.info(`Reset password for "${args.username}".`);
    } catch (error) {
      console.warn(error);
      this.info(`Failed to reset password for "${args.username}".`);
    }
    process.exit(0);
  }
}

module.exports = UserResetPassword
