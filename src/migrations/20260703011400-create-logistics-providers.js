module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('logistics_providers', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      contact_email: { type: Sequelize.STRING(255) },
      contact_phone: { type: Sequelize.STRING(50) },
      regions_served: { type: Sequelize.STRING(255) },
      notes: { type: Sequelize.TEXT },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('logistics_providers');
  },
};
