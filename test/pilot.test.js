const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
let query;
let currentListing = { id: 'listing', title: 'Router', slug: 'router', status: 'active', priceAmount: null, currency: 'EUR', equipmentLocation: 'MU', seller: { kybStatus: 'approved', nickname: 'Operator' }, images: [] };
let created;
const models = {
 Listing: { findAndCountAll: async options => { query = options; return { rows: [], count: 0 }; }, findByPk: async () => currentListing, findOne: async () => null, create: async payload => { created = payload; return { id: 'listing' }; } },
 Seller: { findOne: async () => ({ id: 'seller', kybStatus: 'approved' }) },
 Category: { findByPk: async () => ({ id: 'category' }), findOne: async () => ({ id: 'category' }) },
 ListingImage: {}, User: {}, OrderItem: {}, Order: {},
};
require.cache[require.resolve('../src/models')] = { exports: models };
const listing = require('../src/services/listing.service');
const imports = require('../src/services/shared/listingImportCore');
const requirePilot = require('../src/middleware/requirePilotBuyer');
test('absent price remains null and currency/location survive serialization', () => {
 const result = listing.toPublic(currentListing);
 assert.equal(result.price_amount, null); assert.equal(result.currency, 'EUR'); assert.equal(result.equipment_location, 'MU');
});
test('public queries exclude demo stock and use equipment location', async () => {
 await listing.list({ country: 'mu' });
 assert.equal(query.where.status, 'active'); assert.equal(query.where.equipmentLocation, 'MU');
 assert.equal(query.where.slug[Op.notLike], 'aw-seed-%');
 assert.equal(query.include[0].where.kybStatus, 'approved');
});
test('admin query includes unpublished inventory', async () => {
 await listing.list({}, { viewer: { role: 'admin' } }); assert.equal(query.where.status, undefined);
});
test('public detail hides drafts, demo stock and unapproved sellers', async () => {
 const original = currentListing;
 for (const patch of [{status:'draft'}, {slug:'aw-seed-router'}, {seller:{kybStatus:'pending'}}]) {
  currentListing={...original,...patch}; await assert.rejects(()=>listing.getById('listing'),e=>e.status===404 || e.statusCode===404);
 }
 currentListing=original;
});
test('manual listing accepts omitted price and rejects invalid prices/currencies', async () => {
 const payload = { title:'Router',category_id:'category',condition:'good',currency:'EUR',equipment_location:'MU' };
 await listing.create({ id:'user' },payload); assert.equal(created.priceAmount,null);assert.equal(created.equipmentLocation,'MU');
 for(const price of [-1,0,'NaN']) await assert.rejects(()=>listing.create({id:'user'},{...payload,price_amount:price}));
 await assert.rejects(()=>listing.create({id:'user'},{...payload,currency:'INVALID'}));
});
test('Excel import accepts price on request and validates currencies and location', async () => {
 const row={title:'Router',category_slug:'routers',condition:'good',price_amount:'',currency:'EUR',equipment_location:'MU'};
 const result=await imports.validateCommonFields(row);assert.deepEqual(result.errors,[]);assert.equal(result.price,null);
 assert.ok((await imports.validateCommonFields({...row,price_amount:'abc'})).errors.length);
 assert.ok((await imports.validateCommonFields({...row,equipment_location:'Mauritius'})).errors.length);
 assert.ok(imports.COMMON_COLUMNS.includes('equipment_location'));
});
test('only explicitly approved users and admins may purchase', () => {
 for(const user of [undefined,{role:'buyer'},{role:'seller',pilotBuyer:false}]) { let error;requirePilot({user},{},e=>{error=e;});assert.equal(error.code,'pilot_access_required'); }
 for(const user of [{role:'buyer',pilotBuyer:true},{role:'admin'}]) { let called=false;requirePilot({user},{},e=>{assert.equal(e,undefined);called=true;});assert.ok(called); }
});
// Exercise registration controller validation without database/network side effects.
require.cache[require.resolve('../src/services/auth.service')]={exports:{register:async()=>({user:{id:'new'}})}};
const auth=require('../src/controllers/auth.controller');
test('registration rejects missing or stale legal consent',async()=>{
 const body={email:'test@example.com',password:'long-enough',full_name:'Test'};
 for(const consent of [{},{accepted_terms:true,legal_version:'old'}]) {let error;await auth.register({body:{...body,...consent}},{},e=>{error=e;});assert.equal(error.code,'legal_acceptance_required');}
 let status;await auth.register({body:{...body,accepted_terms:true,legal_version:'2026-10-25'}},{status:n=>{status=n;return{json:()=>{}};}},e=>{throw e;});assert.equal(status,201);
});
const sellerService = require('../src/services/seller.service');
test('seller inventory search and pagination remain scoped to the signed-in seller',async()=>{
 await sellerService.getMyListings({id:'signed-in-user'},{q:'router',status:'draft',page:2,limit:20});
 assert.equal(query.where.sellerId,'seller');assert.equal(query.where.status,'draft');assert.equal(query.offset,20);assert.equal(query.limit,20);
 assert.equal(query.where[Op.or][0].title[Op.like],'%router%');
});
