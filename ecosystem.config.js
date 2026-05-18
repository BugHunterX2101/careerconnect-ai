module.exports = {
  apps: [{
    name: 'careerconnect',
    // Single entry point — cluster.js forks workers internally (capped at 4)
    script: './src/server/cluster.js',
    instances: 1,          // cluster.js manages its own workers
    exec_mode: 'fork',     // let cluster.js handle the forking
    max_memory_restart: '1G',

    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Auto restart
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',

    // Logging
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Performance: enough heap for 4 workers + overhead
    node_args: '--max-old-space-size=2048 --max-semi-space-size=64',

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 15000,

    // Health monitoring
    wait_ready: true,

    // Cluster settings
    instance_var: 'INSTANCE_ID'
  }]
};
