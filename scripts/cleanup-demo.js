// Dry run by default. Review the backup before using --apply on staging.
const fs = require('node:fs/promises');
const path = require('node:path');
const { Op } = require('sequelize');
const { sequelize, Listing, ListingImage, Seller, User } = require('../src/models');
async function main() {
  const rows = await Listing.findAll({ where: { slug: { [Op.like]: 'aw-seed-%' } }, include: [{ model: ListingImage, as: 'images' }] });
  const sellerIds = [...new Set(rows.map(row => row.sellerId))];
  const sellers = sellerIds.length ? await Seller.findAll({where:{id:sellerIds}}) : [];
  const users = sellers.length ? await User.findAll({where:{id:sellers.map(s=>s.userId)},attributes:['id','email','fullName','role','status']}) : [];
  const backup = path.resolve('backups', `awxchange-demo-${Date.now()}.json`);
  await fs.mkdir(path.dirname(backup), {recursive:true});
  await fs.writeFile(backup, JSON.stringify({created_at:new Date(),listings:rows,sellers,users},null,2), {flag:'wx',mode:0o600});
  console.log(`Backed up ${rows.length} seeded listings and associated seller metadata to ${backup}`);
  if (!process.argv.includes('--apply')) { console.log('Dry run only. No database records changed.');return; }
  await sequelize.transaction(async transaction => {
    const ids=rows.map(r=>r.id);if(!ids.length)return;
    await ListingImage.destroy({where:{listingId:ids},transaction});
    await Listing.destroy({where:{id:ids,slug:{[Op.like]:'aw-seed-%'}},transaction});
  });
  console.log('Seeded listings removed. Seller accounts retained for manual identity review; never delete a real seller based on a generic display name.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>sequelize.close());
