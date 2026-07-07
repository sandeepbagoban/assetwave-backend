module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('import_jobs', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      seller_id: { type: Sequelize.UUID, references: { model: 'sellers', key: 'id' }, onDelete: 'SET NULL' },
      uploaded_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      filename: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.ENUM('previewed', 'committed', 'failed'), allowNull: false, defaultValue: 'previewed' },
      row_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      error_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      preview_data: { type: Sequelize.JSON },
      committed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('import_jobs');
  },
};
