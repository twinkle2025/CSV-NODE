'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')

class UserAdd extends Command {
  static get signature () {
    return `
      user:add
      { username : The username of the user }
      { email : The email address of the user }
      { password : The password of the user }
    `
  }

  static get description () {
    return 'Add a user from the command line'
  }

  async handle (args, options) {
    const User = use('App/Models/User');
    const Hash = use('Hash');
    this.info(`Creating user for ${args.username} with email ${args.email}`);
    this.info(`Checking that a user with the email ${args.email} does not already exist`);
    const existingCount = await User.query().where('email', '=', args.email.toLowerCase()).getCount('*');
    if (existingCount > 0) {
      this.error(`Found ${existingCount} user(s) with the email ${args.email}`);
      process.exit(1)
    }
    this.info(`No users with the email ${args.email} exist. Creating user.`);
    const user = new User();
    user.username = args.username;
    user.email = args.email;
    user.password = args.password;
    try {
      await user.save()
    } catch (error) {
      this.error(error.toString());
      process.exit(1)
    }
    this.completed('user:add', `${args.username} with email ${args.email}`);
    process.exit()
  }
}

module.exports = UserAdd
