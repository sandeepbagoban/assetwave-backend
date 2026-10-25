// Resend REST transport; no emails are sent until explicitly configured.
const { Op } = require('sequelize');
const { EmailOutbox, User } = require('../models');
async function queueForUser(userId, subject, message) {
  const user = await User.findByPk(userId);
  if (!user) return;
  return EmailOutbox.create({ recipient: user.email, subject: `AWXchange — ${subject}`, body: `${message}\n\nFor help, contact support@awxchange.com.\nAWXchange`, nextAttemptAt: new Date() });
}
let running = false;
async function deliverPending() {
  if (running || process.env.EMAIL_ENABLED !== 'true') return { sent: 0, skipped: true };
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email delivery requires RESEND_API_KEY and a verified EMAIL_FROM domain.');
  running = true;
  let sent = 0;
  try {
    // Recover interrupted claims. Provider idempotency protects retry delivery.
    await EmailOutbox.update({status:'pending'},{where:{status:'sending',updatedAt:{[Op.lte]:new Date(Date.now()-15*60000)}}});
    const rows = await EmailOutbox.findAll({ where: { status: 'pending', nextAttemptAt: { [Op.lte]: new Date() } }, limit: 20, order: [['createdAt','ASC']] });
    for (const row of rows) {
      // Atomic claim permits multiple Node workers without duplicate sends.
      const [claimed] = await EmailOutbox.update({ status:'sending' }, { where: { id:row.id, status:'pending' } });
      if (!claimed) continue;
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method:'POST', signal:AbortSignal.timeout(15000),
          headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`awxchange/${row.id}`},
          body:JSON.stringify({ from:process.env.EMAIL_FROM, to:[row.recipient], subject:row.subject, text:row.body }),
        });
        if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
        await EmailOutbox.update({ status:'sent',sentAt:new Date(),attempts:row.attempts+1 },{where:{id:row.id}});
        sent++;
      } catch (error) {
        const attempts=row.attempts+1;
        await EmailOutbox.update({ status:attempts>=5?'failed':'pending',attempts,nextAttemptAt:new Date(Date.now()+Math.min(60,2**attempts)*60000) },{where:{id:row.id}});
        console.error('Email delivery failed:',row.id,error.message);
      }
    }
    return {sent};
  } finally { running=false; }
}
module.exports={queueForUser,deliverPending};
