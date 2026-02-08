const pool = require('../db');

async function getNodeSecretByNodeId(nodeId) {
  const result = await pool.query(
    'SELECT node_secret FROM nodes WHERE node_id = $1 AND is_active = true',
    [nodeId]
  );
  return result.rowCount > 0 ? result.rows[0].node_secret : null;
}

module.exports = {
  getNodeSecretByNodeId,
};
