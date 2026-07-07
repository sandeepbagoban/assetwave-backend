const bcrypt = require('bcryptjs');
const { randomUUID: uuidv4 } = require('crypto');

const CATEGORIES = [
  { name: 'Transmitters', slug: 'transmitters' },
  { name: 'Cameras', slug: 'cameras' },
  { name: 'Audio', slug: 'audio' },
  { name: 'Satellite', slug: 'satellite' },
  { name: 'Lighting', slug: 'lighting' },
];

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@assetwave.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [existingAdmin] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = ?',
      { replacements: [adminEmail] }
    );
    if (!existingAdmin.length) {
      await queryInterface.bulkInsert('users', [{
        id: uuidv4(),
        email: adminEmail,
        password_hash: passwordHash,
        full_name: 'AssetWave Admin',
        role: 'admin',
        status: 'active',
        created_at: now,
        updated_at: now,
      }]);
    }

    for (const cat of CATEGORIES) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM categories WHERE slug = ?',
        { replacements: [cat.slug] }
      );
      if (!existing.length) {
        await queryInterface.bulkInsert('categories', [{
          id: uuidv4(),
          name: cat.name,
          slug: cat.slug,
          sort_order: 0,
          created_at: now,
          updated_at: now,
        }]);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', { slug: CATEGORIES.map(c => c.slug) });
    await queryInterface.bulkDelete('users', { email: process.env.SEED_ADMIN_EMAIL || 'admin@assetwave.com' });
  },
};
