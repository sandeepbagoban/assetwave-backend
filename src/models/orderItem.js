module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    listingId: { type: DataTypes.UUID, allowNull: false },
    sellerId: { type: DataTypes.UUID, allowNull: false },
    titleSnapshot: { type: DataTypes.STRING(255), allowNull: false },
    priceAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  }, {
    tableName: 'order_items',
    updatedAt: false,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['seller_id'] },
    ],
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
    OrderItem.belongsTo(models.Seller, { foreignKey: 'sellerId', as: 'seller' });
  };

  return OrderItem;
};
