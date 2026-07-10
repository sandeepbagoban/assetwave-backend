const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/db');
const { runOrderTimeouts } = require('./services/orderTimeouts.service');

const TIMEOUT_CHECK_INTERVAL_MS = 15 * 60 * 1000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Database connection established (${env.db.host}/${env.db.name}).`);
  } catch (err) {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`AssetWave backend listening on http://localhost:${env.port} (env: ${env.nodeEnv})`);
  });

  // Belt-and-suspenders for the 3-day escrow timeouts: this in-process
  // interval handles the common case, and POST /admin/orders/run-timeouts
  // exists as a manual/external-cron fallback in case this process gets
  // recycled on an idle host before the interval fires.
  setInterval(() => {
    runOrderTimeouts().catch(err => console.error('runOrderTimeouts failed:', err.message));
  }, TIMEOUT_CHECK_INTERVAL_MS);
}

start();
