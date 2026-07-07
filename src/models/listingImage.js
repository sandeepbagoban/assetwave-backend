module.exports = (sequelize, DataTypes) => {
  const ListingImage = sequelize.define('ListingImage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    listingId: { type: DataTypes.UUID, allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'listing_images',
    updatedAt: false,
    indexes: [{ fields: ['listing_id'] }],
  });

  ListingImage.associate = (models) => {
    ListingImage.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
  };

  return ListingImage;
};
