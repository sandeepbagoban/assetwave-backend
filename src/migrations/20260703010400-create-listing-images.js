module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('listing_images', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      listing_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'listings', key: 'id' }, onDelete: 'CASCADE' },
      url: { type: Sequelize.STRING(500), allowNull: false },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('listing_images', ['listing_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('listing_images');
  },
};
