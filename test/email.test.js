const test = require('node:test');
const assert = require('node:assert/strict');
let row, updates=[];
const outbox = {
 create: async value => {row={id:'mail-1',attempts:0,...value};return row;},
 findAll: async()=>row?[row]:[],
 update:async(value,options)=>{updates.push({value,options});return [1];},
};
require.cache[require.resolve('../src/models')]={exports:{EmailOutbox:outbox,User:{findByPk:async()=>({email:'recipient@example.com'})}}};
const email=require('../src/services/email.service');
test('transaction emails queue and delivery requires explicit configuration',async()=>{
 await email.queueForUser('u','Welcome','Your account is ready.');
 assert.equal(row.recipient,'recipient@example.com');assert.match(row.subject,/AWXchange/);
 process.env.EMAIL_ENABLED='false';
 const previousFetch=global.fetch;global.fetch=()=>{throw Error('Must not send');};
 assert.deepEqual(await email.deliverPending(),{sent:0,skipped:true});
 process.env.EMAIL_ENABLED='true';delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;
 await assert.rejects(()=>email.deliverPending(),/requires/);
 process.env.RESEND_API_KEY='test-key';process.env.EMAIL_FROM='AWXchange <support@example.com>';
 let request;global.fetch=async(url,options)=>{request={url,options};return {ok:true};};
 assert.deepEqual(await email.deliverPending(),{sent:1});
 assert.equal(request.options.headers['Idempotency-Key'],'awxchange/mail-1');
 assert.equal(updates.at(-1).value.status,'sent');
 global.fetch=async()=>({ok:false,status:503});updates=[];
 assert.deepEqual(await email.deliverPending(),{sent:0});
 assert.equal(updates.at(-1).value.status,'pending');assert.equal(updates.at(-1).value.attempts,1);
 global.fetch=previousFetch;
});
