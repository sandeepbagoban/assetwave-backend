const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const { RefreshToken } = require('../models');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function expiresInToDate(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const ms = match
    ? Number(match[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]]
    : 30 * 86400000;
  return new Date(Date.now() + ms);
}

async function issueRefreshToken(user) {
  const raw = crypto.randomBytes(48).toString('hex');
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(raw),
    expiresAt: expiresInToDate(env.jwt.refreshExpiresIn),
  });
  return raw;
}

async function rotateRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ where: { tokenHash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;

  record.revokedAt = new Date();
  await record.save();

  return record;
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.update({ revokedAt: new Date() }, { where: { tokenHash, revokedAt: null } });
}

module.exports = { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, hashToken };
