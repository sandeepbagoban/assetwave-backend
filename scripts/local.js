// Explicit local development runner. The normal server keeps using .env.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), override: true });
if (process.env.DB_HOST !== '127.0.0.1' || process.env.DB_NAME !== 'awxchange_local') throw new Error('Refusing to run local tooling against another database.');
const mode = process.argv[2] || 'server';
if (mode === 'migrate') {
 const result = spawnSync(process.execPath, [require.resolve('sequelize-cli/lib/sequelize'), 'db:migrate'], { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit' });
 process.exitCode = result.status ?? 1;
} else if (mode === 'server') {
 require('../src/config/db').options.logging = false;
 require('../src/server');
} else { throw new Error('Use server or migrate.'); }
