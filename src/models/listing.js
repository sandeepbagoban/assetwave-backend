module.exports = (sequelize, DataTypes) => {
  const Listing = sequelize.define('Listing', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerId: { type: DataTypes.UUID, allowNull: false },
    categoryId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
    brand: { type: DataTypes.STRING(120) },
    model: { type: DataTypes.STRING(120) },
    yearManufactured: { type: DataTypes.SMALLINT },
    condition: { type: DataTypes.ENUM('excellent', 'good', 'fair'), allowNull: false },
    description: { type: DataTypes.TEXT },
    priceAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    originCountry: { type: DataTypes.STRING(2) },
    newPriceEstimate: { type: DataTypes.DECIMAL(12, 2) },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    weightKg: { type: DataTypes.DECIMAL(10, 2) },
    lengthCm: { type: DataTypes.DECIMAL(8, 2) },
    widthCm: { type: DataTypes.DECIMAL(8, 2) },
    heightCm: { type: DataTypes.DECIMAL(8, 2) },
    status: { type: DataTypes.ENUM('draft', 'active', 'sold', 'archived'), allowNull: false, defaultValue: 'draft' },
  }, {
    tableName: 'listings',
    indexes: [
      { fields: ['category_id'] },
      { fields: ['seller_id'] },
      { fields: ['status'] },
    ],
  });

  Listing.associate = (models) => {
    Listing.belongsTo(models.Seller, { foreignKey: 'sellerId', as: 'seller' });
    Listing.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Listing.hasMany(models.ListingImage, { foreignKey: 'listingId', as: 'images' });
    Listing.hasMany(models.CartItem, { foreignKey: 'listingId', as: 'cartItems' });
    Listing.hasMany(models.OrderItem, { foreignKey: 'listingId', as: 'orderItems' });
  };

  return Listing;
};
