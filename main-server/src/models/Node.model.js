/**
 * Node entity - DB table definition and mapping.
 * Response never exposes node_secret; used only for auth check.
 */
const TABLE_NAME = 'nodes';

const COLUMNS = {
  NODE_ID: 'node_id',
  NODE_SECRET: 'node_secret',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

module.exports = {
  TABLE_NAME,
  COLUMNS,
};
