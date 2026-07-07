module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(140), allowNull: false, unique: true },
      parent_id: { type: Sequelize.UUID, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('categories');
  },
};
