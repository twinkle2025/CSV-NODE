module.exports = {
  apps : [{
    name: 'bastion-exporter',
    script: 'ace run:exports',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '4G',
    node_args: ['--max-old-space-size=4096', '--max_old_space_size=4096', '--optimize_for_size'],
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};