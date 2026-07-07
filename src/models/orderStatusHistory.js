module.exports = (sequelize, DataTypes) => {
  const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    fromStatus: { type: DataTypes.STRING(30) },
    toStatus: { type: DataTypes.STRING(30), allowNull: false },
    changedBy: { type: DataTypes.UUID },
    note: { type: DataTypes.TEXT },
  }, {
    tableName: 'order_status_history',
    updatedAt: false,
    indexes: [{ fields: ['order_id'] }],
  });

  OrderStatusHistory.associate = (models) => {
    OrderStatusHistory.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderStatusHistory.belongsTo(models.User, { foreignKey: 'changedBy', as: 'changedByUser' });
  };

  return OrderStatusHistory;
};
