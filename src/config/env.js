require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),

  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),

  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@assetwave.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
  },
};
