/**
 * Worker config from env. For 2 nodes: run with ENV_FILE=.env.node1 or .env.node2
 * or copy the right .env before start.
 */
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });

const MAIN_SERVER_URL = (process.env.MAIN_SERVER_URL || 'http://localhost:8080').replace(/\/$/, '');
const NODE_ID = process.env.NODE_ID;
const NODE_SECRET = process.env.NODE_SECRET;
const POLL_INTERVAL_MS = Math.max(2000, parseInt(process.env.POLL_INTERVAL_MS, 10) || 10000);

function validate() {
  if (!NODE_ID || !NODE_SECRET) {
    throw new Error('NODE_ID and NODE_SECRET are required in .env');
  }
  try {
    new URL(MAIN_SERVER_URL);
  } catch {
    throw new Error('Invalid MAIN_SERVER_URL in .env');
  }
}

module.exports = {
  MAIN_SERVER_URL,
  NODE_ID,
  NODE_SECRET,
  POLL_INTERVAL_MS,
  validate,
};
