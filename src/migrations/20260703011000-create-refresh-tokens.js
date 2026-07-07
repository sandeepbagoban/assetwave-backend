module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token_hash: { type: Sequelize.STRING(255), allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      revoked_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('refresh_tokens');
  },
};
