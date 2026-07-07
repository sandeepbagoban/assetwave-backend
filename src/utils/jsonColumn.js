// MariaDB (unlike real MySQL) stores JSON columns as LONGTEXT under the hood,
// so mysql2 can't auto-parse them the way it does for genuine MySQL JSON
// columns — Sequelize then hands back a raw string instead of an object.
// This getter normalizes both cases so callers always see a real value
// regardless of which DB the app is pointed at (local MariaDB or MySQL).
function jsonColumnOptions(DataTypes, fieldName) {
  return {
    type: DataTypes.JSON,
    get() {
      const raw = this.getDataValue(fieldName);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    },
  };
}

module.exports = { jsonColumnOptions };
