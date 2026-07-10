module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sellers', 'nickname', { type: Sequelize.STRING(100) });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('sellers', 'nickname');
  },
};
