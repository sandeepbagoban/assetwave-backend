const { User, Seller } = require('../../models');
const AppError = require('../../utils/AppError');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { toPublicUser } = require('../auth.service');

async function listUsers(query) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  if (query.role) where.role = query.role;

  const { rows, count } = await User.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
  return paginatedResponse(rows.map(toPublicUser), count, { page, limit });
}

async function listBuyers(query) {
  return listUsers({ ...query, role: 'buyer' });
}

async function getUser(id) {
  const user = await User.findByPk(id, { include: [{ model: Seller, as: 'sellerProfile' }] });
  if (!user) throw new AppError(404, 'not_found', 'User not found.');
  return toPublicUser(user);
}

async function setUserStatus(id, status) {
  if (!['active', 'suspended'].includes(status)) {
    throw new AppError(400, 'validation_error', 'status must be active or suspended.');
  }
  const user = await User.findByPk(id);
  if (!user) throw new AppError(404, 'not_found', 'User not found.');

  user.status = status;
  await user.save();
  return toPublicUser(user);
}

module.exports = { listUsers, listBuyers, getUser, setUserStatus };
