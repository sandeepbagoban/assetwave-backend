const { Seller, User } = require('../../models');
const AppError = require('../../utils/AppError');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const sellerService = require('../seller.service');

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  if (query.kyb_status) where.kybStatus = query.kyb_status;

  const { rows, count } = await Seller.findAndCountAll({
    where, include: [{ model: User, as: 'user' }], limit, offset, order: [['createdAt', 'DESC']],
  });

  const data = rows.map(seller => ({
    ...sellerService.toPublic(seller),
    user_email: seller.user?.email,
    user_full_name: seller.user?.fullName,
  }));
  return paginatedResponse(data, count, { page, limit });
}

async function getById(id) {
  const seller = await Seller.findByPk(id, { include: [{ model: User, as: 'user' }] });
  if (!seller) throw new AppError(404, 'not_found', 'Seller not found.');
  return { ...sellerService.toPublic(seller), user_email: seller.user?.email, user_full_name: seller.user?.fullName };
}

async function decide(admin, id, decision, notes) {
  const seller = await Seller.findByPk(id, { include: [{ model: User, as: 'user' }] });
  if (!seller) throw new AppError(404, 'not_found', 'Seller not found.');

  if (decision === 'approve') {
    seller.kybStatus = 'approved';
    seller.verified = true;
    seller.user.role = 'seller';
    await seller.user.save();
  } else if (decision === 'reject') {
    seller.kybStatus = 'rejected';
    seller.verified = false;
  } else if (decision === 'suspend') {
    seller.kybStatus = 'suspended';
    seller.verified = false;
    seller.user.role = 'buyer';
    await seller.user.save();
  } else {
    throw new AppError(400, 'validation_error', 'decision must be approve, reject, or suspend.');
  }

  seller.kybNotes = notes || seller.kybNotes;
  seller.reviewedBy = admin.id;
  seller.reviewedAt = new Date();
  await seller.save();

  return getById(id);
}

module.exports = { list, getById, decide };
