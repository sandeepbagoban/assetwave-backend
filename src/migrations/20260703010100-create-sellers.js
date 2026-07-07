module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sellers', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      org_name: { type: Sequelize.STRING(255), allowNull: false },
      account_type: { type: Sequelize.ENUM('organization', 'individual'), allowNull: false, defaultValue: 'organization' },
      country: { type: Sequelize.STRING(2), allowNull: false },
      registration_no: { type: Sequelize.STRING(100) },
      kyb_status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'suspended'), allowNull: false, defaultValue: 'pending' },
      kyb_notes: { type: Sequelize.TEXT },
      verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      reviewed_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      reviewed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('sellers', ['kyb_status']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('sellers');
  },
};
