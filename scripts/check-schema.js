const { sequelize, User, Listing, Seller, RefreshToken, EmailOutbox } = require('../src/models');
sequelize.options.logging = false;
async function main() {
  await sequelize.authenticate();
  const q = sequelize.getQueryInterface();
  const issues = [];
  for (const model of [User, Listing, Seller, RefreshToken, EmailOutbox]) {
    let columns;
    try { columns = await q.describeTable(model.getTableName()); }
    catch (error) { issues.push({ table: model.getTableName(), error: error.original?.code || error.message }); continue; }
    const missing = Object.values(model.rawAttributes).filter(a => a.type?.key !== 'VIRTUAL' && !columns[a.field]).map(a => a.field);
    if (missing.length) issues.push({ table: model.getTableName(), missing_columns: missing });
  }
  console.log(JSON.stringify({ database_connected: true, schema_ready: issues.length === 0, issues }, null, 2));
  if (issues.length) process.exitCode = 1;
}
main().catch(error => { console.error(JSON.stringify({ database_connected: false, error: error.original?.code || error.message })); process.exitCode = 1; }).finally(() => sequelize.close());
