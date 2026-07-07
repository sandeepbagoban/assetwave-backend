module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      full_name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(50) },
      role: { type: Sequelize.ENUM('buyer', 'seller', 'admin'), allowNull: false, defaultValue: 'buyer' },
      status: { type: Sequelize.ENUM('active', 'suspended'), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('users', ['role']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  },
};
