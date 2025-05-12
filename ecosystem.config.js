module.exports = {
    apps: [
      {
        name: 'server',
        script: 'dist/server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '300M',
        env: {
          NODE_ENV: 'production',
          PORT: 8080
        },
        error_file: './logs/server-error.log',
        out_file: './logs/server-out.log',
        merge_logs: true,
      },
      {
        name: 'process-document',
        script: 'dist/workers/process-document.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
        error_file: './logs/process-document-error.log',
        out_file: './logs/process-document-out.log',
        merge_logs: true,
      },
      {
        name: 'telegram-worker',
        script: 'dist/workers/telegram-worker.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
        error_file: './logs/telegram-worker-error.log',
        out_file: './logs/telegram-worker-out.log',
        merge_logs: true,
      },
      {
        name: 'email-worker',
        script: 'dist/workers/email.worker.js',
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
        error_file: './logs/email-worker-error.log',
        out_file: './logs/email-worker-out.log',
        merge_logs: true,
      }
    ]
  };
  