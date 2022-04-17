'use strict'

const path = require("path");

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
  '@adonisjs/framework/providers/AppProvider',
  '@adonisjs/framework/providers/ViewProvider',
  '@adonisjs/lucid/providers/LucidProvider',
  '@adonisjs/bodyparser/providers/BodyParserProvider',
  '@adonisjs/cors/providers/CorsProvider',
  '@adonisjs/shield/providers/ShieldProvider',
  '@adonisjs/session/providers/SessionProvider',
  '@adonisjs/auth/providers/AuthProvider',
  '@adonisjs/redis/providers/RedisProvider',
  '@adonisjs/validator/providers/ValidatorProvider',
  '@adonisjs/drive/providers/DriveProvider',
  path.join(__dirname, '..', 'providers', 'ExportApis/Provider'),
  path.join(__dirname, '..', 'providers', 'MessageProviders/Provider'),
  path.join(__dirname, '..', 'providers', 'Notifications/Provider'),
  path.join(__dirname, '..', 'providers', 'LeadImporter/Provider'),
  path.join(__dirname, '..', 'providers', 'LeadExporter/Provider'),
  path.join(__dirname, '..', 'providers', 'SleepProvider'),
  path.join(__dirname, '..', 'providers', 'ChunkedForEach'),
  path.join(__dirname, '..', 'providers', 'ElasticsearchProvider'),
  path.join(__dirname, '..', 'providers', 'ProcessingPerSecondProvider'),
  path.join(__dirname, '..', 'providers', 'MessageProvider/Provider'),
]

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are required only when running ace commands. For example
| Providers for migrations, tests etc.
|
*/
const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider'
]

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {}

/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = [
  'App/Commands/UserAdd',
  'App/Commands/CheckElasticSearch',
  'App/Commands/RunForkedJob',
  'App/Commands/Push',
  'App/Commands/ResetUserMfa',
  'App/Commands/UserResetPassword',
  'App/Commands/GetDuplicatesFromElasticsearch',
  'App/Commands/PopulateExistingConversion',
  'App/Commands/UserDisable',
]

module.exports = { providers, aceProviders, aliases, commands }
