module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    buyerId: { type: DataTypes.UUID, allowNull: false, unique: true },
  }, {
    tableName: 'carts',
  });

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: 'buyerId', as: 'buyer' });
    Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'items' });
  };

  return Cart;
};
