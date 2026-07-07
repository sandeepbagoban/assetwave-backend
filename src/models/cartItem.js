module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cartId: { type: DataTypes.UUID, allowNull: false },
    listingId: { type: DataTypes.UUID, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  }, {
    tableName: 'cart_items',
    indexes: [{ unique: true, fields: ['cart_id', 'listing_id'] }],
  });

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
    CartItem.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
  };

  return CartItem;
};
