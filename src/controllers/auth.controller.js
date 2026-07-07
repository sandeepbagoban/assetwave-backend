const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/auth.service');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterBody({ email, password, full_name }) {
  if (!email || !EMAIL_RE.test(email)) throw new AppError(400, 'validation_error', 'A valid email is required.');
  if (!password || password.length < 8) throw new AppError(400, 'validation_error', 'Password must be at least 8 characters.');
  if (!full_name || !full_name.trim()) throw new AppError(400, 'validation_error', 'Full name is required.');
}

const register = asyncHandler(async (req, res) => {
  validateRegisterBody(req.body);
  const { email, password, full_name, phone } = req.body;
  const result = await authService.register({ email, password, fullName: full_name, phone });
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError(400, 'validation_error', 'Email and password are required.');
  const result = await authService.login({ email, password });
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) throw new AppError(400, 'validation_error', 'refresh_token is required.');
  const result = await authService.refresh(refresh_token);
  res.json(result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refresh_token);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: authService.toPublicUser(req.user) });
});

module.exports = { register, login, refresh, logout, me };
