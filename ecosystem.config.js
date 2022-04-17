module.exports = {
  apps : [{
    name: 'bastion',
    script: 'npm start',
    instances: 1,
    autorestart: true,
    watch: true,
    ignore_watch: ['node_modules', 'public', 'resources', 'ecosystem.config.js', 'webpack.mix.js', 'node_modules/.cache', '.git', 'newrelic_agent.log', 'tmp', 'public/', '.DS_Store', 'public/assets/images/.DS_Store', 'tmp/*'],
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
