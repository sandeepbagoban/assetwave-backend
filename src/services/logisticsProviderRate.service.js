const { LogisticsProvider, LogisticsProviderRate } = require('../models');
const AppError = require('../utils/AppError');

function toPublic(rate) {
  return { id: rate.id, country_code: rate.countryCode, price_amount: Number(rate.priceAmount), currency: rate.currency };
}

async function requireProvider(providerId) {
  const provider = await LogisticsProvider.findByPk(providerId);
  if (!provider) throw new AppError(404, 'not_found', 'Logistics provider not found.');
  return provider;
}

async function create(providerId, payload) {
  await requireProvider(providerId);
  if (payload.price_amount === undefined || payload.price_amount === null || Number(payload.price_amount) < 0) {
    throw new AppError(400, 'validation_error', 'price_amount is required and must be >= 0.');
  }
  const countryCode = payload.country_code ? String(payload.country_code).toUpperCase() : null;
  if (countryCode && countryCode.length !== 2) {
    throw new AppError(400, 'validation_error', 'country_code must be a 2-letter code, or omitted for a default rate.');
  }

  const existing = await LogisticsProviderRate.findOne({ where: { logisticsProviderId: providerId, countryCode } });
  if (existing) {
    throw new AppError(409, 'duplicate_rate', countryCode
      ? `A rate for ${countryCode} already exists on this provider — edit it instead.`
      : 'A default rate already exists on this provider — edit it instead.');
  }

  const rate = await LogisticsProviderRate.create({
    logisticsProviderId: providerId,
    countryCode,
    priceAmount: payload.price_amount,
    currency: payload.currency || 'USD',
  });
  return toPublic(rate);
}

async function update(providerId, rateId, payload) {
  const rate = await LogisticsProviderRate.findOne({ where: { id: rateId, logisticsProviderId: providerId } });
  if (!rate) throw new AppError(404, 'not_found', 'Rate not found.');

  if (payload.price_amount !== undefined) {
    if (Number(payload.price_amount) < 0) throw new AppError(400, 'validation_error', 'price_amount must be >= 0.');
    rate.priceAmount = payload.price_amount;
  }
  if (payload.currency !== undefined) rate.currency = payload.currency;
  await rate.save();
  return toPublic(rate);
}

async function remove(providerId, rateId) {
  const deleted = await LogisticsProviderRate.destroy({ where: { id: rateId, logisticsProviderId: providerId } });
  if (!deleted) throw new AppError(404, 'not_found', 'Rate not found.');
}

module.exports = { create, update, remove, toPublic };
