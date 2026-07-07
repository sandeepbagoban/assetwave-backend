const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/db');

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
}

start();
