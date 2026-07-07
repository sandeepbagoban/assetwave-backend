module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    parentId: { type: DataTypes.UUID },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'categories',
  });

  Category.associate = (models) => {
    Category.belongsTo(models.Category, { foreignKey: 'parentId', as: 'parent' });
    Category.hasMany(models.Category, { foreignKey: 'parentId', as: 'children' });
    Category.hasMany(models.Listing, { foreignKey: 'categoryId', as: 'listings' });
  };

  return Category;
};
