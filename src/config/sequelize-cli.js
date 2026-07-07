// Config consumed by sequelize-cli (migrations/seeders), which cannot read
// our app's src/config/env.js directly — it needs a plain exported object.
require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: 20000,
  },
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
