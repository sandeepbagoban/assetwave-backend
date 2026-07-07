const { Seller, User, Listing, ListingImage, Category, OrderItem, Order } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const listingService = require('./listing.service');

function toPublic(seller) {
  return {
    id: seller.id,
    user_id: seller.userId,
    org_name: seller.orgName,
    account_type: seller.accountType,
    country: seller.country,
    registration_no: seller.registrationNo,
    kyb_status: seller.kybStatus,
    kyb_notes: seller.kybNotes,
    verified: seller.verified,
    created_at: seller.createdAt,
  };
}

async function apply(user, payload) {
  const existing = await Seller.findOne({ where: { userId: user.id } });
  if (existing) throw new AppError(409, 'already_applied', 'You already have a seller application on file.');

  if (!payload.org_name || !payload.country) {
    throw new AppError(400, 'validation_error', 'org_name and country are required.');
  }

  const seller = await Seller.create({
    userId: user.id,
    orgName: payload.org_name,
    accountType: payload.account_type === 'individual' ? 'individual' : 'organization',
    country: payload.country,
    registrationNo: payload.registration_no,
    kybStatus: 'pending',
  });

  return toPublic(seller);
}

async function getMe(user) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  return seller ? toPublic(seller) : null;
}

async function getMyListings(user, query) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller) throw new AppError(404, 'not_found', 'No seller profile found.');

  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await Listing.findAndCountAll({
    where: { sellerId: seller.id },
    include: [{ model: Seller, as: 'seller' }, { model: Category, as: 'category' }, { model: ListingImage, as: 'images' }],
    limit, offset, order: [['createdAt', 'DESC']],
  });

  return paginatedResponse(rows.map(listingService.toPublic), count, { page, limit });
}

async function getMyOrders(user, query) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller) throw new AppError(404, 'not_found', 'No seller profile found.');

  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await OrderItem.findAndCountAll({
    where: { sellerId: seller.id },
    include: [{ model: Order, as: 'order', include: [{ model: User, as: 'buyer' }] }],
    limit, offset, order: [['createdAt', 'DESC']],
  });

  const data = rows.map(item => ({
    order_item_id: item.id,
    order_id: item.orderId,
    order_status: item.order.status,
    placed_at: item.order.placedAt,
    listing_id: item.listingId,
    title_snapshot: item.titleSnapshot,
    price_amount: Number(item.priceAmount),
    quantity: item.quantity,
    buyer_name: item.order.buyer?.fullName,
  }));

  return paginatedResponse(data, count, { page, limit });
}

module.exports = { apply, getMe, getMyListings, getMyOrders, toPublic };
