const test=require('node:test');const assert=require('node:assert/strict');
let createdOrder;let history=[];
const stock={id:'listing',sellerId:'seller',title:'Router',status:'active',priceAmount:100,currency:'USD',quantity:2,save:async()=>{}};
const models={
 sequelize:{transaction:async fn=>fn({LOCK:{UPDATE:'UPDATE'}})},
 Listing:{findByPk:async()=>stock},
 Cart:{findOne:async()=>({id:'cart',items:[{listingId:'listing',quantity:1,listing:stock}]})},
 CartItem:{destroy:async()=>{}},
 OrderItem:{bulkCreate:async()=>{}},
 OrderStatusHistory:{create:async row=>history.push(row)},
 Order:{create:async row=>{createdOrder={id:'order',...row};return createdOrder;},findByPk:async()=>({...createdOrder,items:[],statusHistory:[],placedAt:new Date()})},
 Seller:{},User:{},LogisticsProvider:{},
};
require.cache[require.resolve('../src/models')]={exports:models};
require.cache[require.resolve('../src/services/notification.service')]={exports:{notifySellers:async()=>{}}};
require.cache[require.resolve('../src/services/email.service')]={exports:{queueForUser:async()=>{}}};
require.cache[require.resolve('../src/services/logisticsProvider.service')]={exports:{getRateForCountry:async()=>null}};
const orders=require('../src/services/order.service');
test('pilot basket awaits manual bank-transfer confirmation instead of simulating payment',async()=>{
 const result=await orders.checkout({id:'buyer'},{shipping_address:{name:'Buyer',line1:'Street',city:'Town',country:'MU',postal_code:'12345'}});
 assert.equal(result.status,'pending_payment');assert.equal(createdOrder.paymentMethod,'bank_transfer');
 assert.equal(createdOrder.escrowHeldAt,undefined);assert.equal(history.length,1);assert.equal(history[0].toStatus,'pending_payment');
});
