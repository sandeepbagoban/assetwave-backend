// Manually-maintained logistics provider directory (DHL, FedEx, UPS,
// Chronopost/Colissimo, regional freight forwarders, etc.) — per the product
// plan, shipping cost/transit-time data is tracked manually for the first
// batch of orders before any carrier API integration is considered.
const { LogisticsProvider, LogisticsProviderRate } = require('../models');
const AppError = require('../utils/AppError');

const RATES_INCLUDE = [{ model: LogisticsProviderRate, as: 'rates' }];

function toPublic(provider) {
  return {
    id: provider.id,
    name: provider.name,
    contact_email: provider.contactEmail,
    contact_phone: provider.contactPhone,
    regions_served: provider.regionsServed,
    notes: provider.notes,
    active: provider.active,
    rates: (provider.rates || [])
      .map(r => ({ id: r.id, country_code: r.countryCode, price_amount: Number(r.priceAmount), currency: r.currency }))
      .sort((a, b) => (a.country_code || 'zz').localeCompare(b.country_code || 'zz')),
  };
}

async function list({ activeOnly } = {}) {
  const where = activeOnly ? { active: true } : {};
  const providers = await LogisticsProvider.findAll({ where, include: RATES_INCLUDE, order: [['name', 'ASC']] });
  return providers.map(toPublic);
}

async function getById(id) {
  const provider = await LogisticsProvider.findByPk(id, { include: RATES_INCLUDE });
  if (!provider) throw new AppError(404, 'not_found', 'Logistics provider not found.');
  return toPublic(provider);
}

// Exact country match wins; a NULL-country_code row on the provider is used
// as a fallback/default rate. Returns null if the provider ships nowhere
// matching (caller decides how to handle — checkout rejects with a 400).
async function getRateForCountry(providerId, countryCode) {
  const rates = await LogisticsProviderRate.findAll({ where: { logisticsProviderId: providerId } });
  const exact = rates.find(r => r.countryCode === countryCode);
  if (exact) return exact;
  return rates.find(r => !r.countryCode) || null;
}

async function create(payload) {
  if (!payload.name || !payload.name.trim()) throw new AppError(400, 'validation_error', 'name is required.');
  const provider = await LogisticsProvider.create({
    name: payload.name,
    contactEmail: payload.contact_email,
    contactPhone: payload.contact_phone,
    regionsServed: payload.regions_served,
    notes: payload.notes,
    active: payload.active === undefined ? true : Boolean(payload.active),
  });
  return toPublic(provider);
}

async function update(id, payload) {
  const provider = await LogisticsProvider.findByPk(id);
  if (!provider) throw new AppError(404, 'not_found', 'Logistics provider not found.');

  const fieldMap = {
    name: 'name', contact_email: 'contactEmail', contact_phone: 'contactPhone',
    regions_served: 'regionsServed', notes: 'notes', active: 'active',
  };
  for (const [key, field] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) provider[field] = payload[key];
  }
  await provider.save();
  return toPublic(provider);
}

async function remove(id) {
  const deleted = await LogisticsProvider.destroy({ where: { id } });
  if (!deleted) throw new AppError(404, 'not_found', 'Logistics provider not found.');
}

module.exports = { list, getById, create, update, remove, toPublic, getRateForCountry };
