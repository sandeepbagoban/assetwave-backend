const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('sequelize').DataTypes;
const migration = require('../src/migrations/20261025010000-pilot-listings-and-consent');

test('pilot migration can resume after partial MySQL DDL and run again', async () => {
  const tables = { listings: { price_amount: { allowNull: false } }, users: {} };
  const calls = [];
  let interrupt = true;
  const q = {
    describeTable: async name => tables[name],
    changeColumn: async (table, column, definition) => { tables[table][column] = definition; calls.push(column); },
    addColumn: async (table, column, definition) => {
      assert.equal(tables[table][column], undefined);
      if (column === 'terms_accepted_at' && interrupt) { interrupt = false; throw new Error('interrupted'); }
      tables[table][column] = definition; calls.push(column);
    },
  };
  await assert.rejects(migration.up(q, S), /interrupted/);
  await migration.up(q, S);
  await migration.up(q, S);
  assert.deepEqual(calls, ['price_amount', 'equipment_location', 'pilot_buyer', 'terms_accepted_at', 'legal_version']);
});
