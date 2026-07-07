const bcrypt = require('bcryptjs');
const { User, Cart } = require('../models');
const AppError = require('../utils/AppError');
const { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('./token.service');

async function register({ email, password, fullName, phone }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError(409, 'email_taken', 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, fullName, phone, role: 'buyer' });
  await Cart.create({ buyerId: user.id });

  return issueTokens(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError(401, 'invalid_credentials', 'Incorrect email or password.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'invalid_credentials', 'Incorrect email or password.');
  if (user.status !== 'active') throw new AppError(403, 'account_suspended', 'This account has been suspended.');

  return issueTokens(user);
}

async function refresh(rawRefreshToken) {
  const record = await rotateRefreshToken(rawRefreshToken);
  if (!record) throw new AppError(401, 'invalid_refresh_token', 'Refresh token is invalid or expired.');

  const user = await User.findByPk(record.userId);
  if (!user || user.status !== 'active') throw new AppError(401, 'unauthorized', 'User no longer active.');

  return issueTokens(user);
}

async function logout(rawRefreshToken) {
  if (rawRefreshToken) await revokeRefreshToken(rawRefreshToken);
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  return { accessToken, refreshToken, user: toPublicUser(user) };
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

module.exports = { register, login, refresh, logout, toPublicUser };
