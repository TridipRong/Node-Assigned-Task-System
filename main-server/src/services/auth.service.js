const jwt = require('jsonwebtoken');
const nodeRepository = require('../repositories/node.repository');

/**
 * Authenticate node by id and secret; returns JWT.
 * @param {string} nodeId
 * @param {string} nodeSecret
 * @returns {Promise<{ token: string }>}
 * @throws {Error} statusCode 401 when credentials invalid
 */
async function loginNode(nodeId, nodeSecret) {
  const storedSecret = await nodeRepository.getNodeSecretByNodeId(nodeId);

  if (!storedSecret || storedSecret !== nodeSecret) {
    const err = new Error('Invalid node credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { type: 'node', node_id: nodeId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('[Auth] node login', { node_id: nodeId });
  return { token };
}

/**
 * Authenticate admin by username/password (from env); returns JWT.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string }>}
 * @throws {Error} statusCode 401 when credentials invalid
 */
async function loginAdmin(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    const err = new Error('Admin login not configured');
    err.statusCode = 503;
    throw err;
  }

  if (username !== expectedUser || password !== expectedPass) {
    const err = new Error('Invalid admin credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { type: 'admin', username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('[Auth] admin login', { username });
  return { token };
}

module.exports = {
  loginNode,
  loginAdmin,
};
