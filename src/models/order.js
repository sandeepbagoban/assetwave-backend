// Order status is the single escrow-lifecycle source of truth (no separate
// escrow table) — pending_payment -> paid -> shipped -> delivered -> released,
// with refunded/disputed/cancelled branches. order_status_history audits every hop.
const { jsonColumnOptions } = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    buyerId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending_payment', 'paid', 'shipped', 'delivered', 'released', 'refunded', 'disputed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending_payment',
    },
    subtotalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    shippingAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    shippingAddress: { ...jsonColumnOptions(DataTypes, 'shippingAddress'), allowNull: false },
    paymentMethod: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'simulated' },
    escrowHeldAt: { type: DataTypes.DATE },
    escrowReleasedAt: { type: DataTypes.DATE },
    escrowRefundedAt: { type: DataTypes.DATE },
    shippedAt: { type: DataTypes.DATE },
    deliveredAt: { type: DataTypes.DATE },
    logisticsProviderId: { type: DataTypes.UUID },
    trackingNumber: { type: DataTypes.STRING(100) },
    disputeReason: { type: DataTypes.TEXT },
    disputeResolvedBy: { type: DataTypes.UUID },
    placedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'orders',
    indexes: [
      { fields: ['buyer_id'] },
      { fields: ['status'] },
    ],
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'buyerId', as: 'buyer' });
    Order.belongsTo(models.User, { foreignKey: 'disputeResolvedBy', as: 'disputeResolver' });
    Order.belongsTo(models.LogisticsProvider, { foreignKey: 'logisticsProviderId', as: 'logisticsProvider' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
    Order.hasMany(models.OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory' });
  };

  return Order;
};
