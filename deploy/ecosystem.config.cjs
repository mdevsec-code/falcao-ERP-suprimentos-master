/**
 * PM2: mantém a API no ar e reinicia se cair ou se o servidor reiniciar.
 * O `cwd` é apps/api — a API lê o `.env` dela e depois o da raiz.
 */
const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'falcao-erp-api',
      cwd: path.join(__dirname, '..', 'apps', 'api'),
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '600M',
      time: true,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
