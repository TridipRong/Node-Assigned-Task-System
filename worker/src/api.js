const fetch = require('node-fetch');
const config = require('./config');

let token = null;

async function login() {
  const res = await fetch(`${config.MAIN_SERVER_URL}/auth/node/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node_id: config.NODE_ID,
      node_secret: config.NODE_SECRET,
    }),
  });
  if (!res.ok) {
    console.error('[Worker] login failed', { status: res.status, node_id: config.NODE_ID });
    const err = new Error(res.status === 401 ? 'Invalid node credentials' : 'Login failed');
    err.statusCode = res.status;
    throw err;
  }
  const data = await res.json();
  token = data.token;
  console.log('[Worker] node login ok', { node_id: config.NODE_ID });
  return token;
}

async function getAssignedTasks() {
  if (!token) await login();
  const res = await fetch(`${config.MAIN_SERVER_URL}/tasks/assigned`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    token = null;
    await login();
    return getAssignedTasks();
  }
  if (!res.ok) throw new Error(`getAssigned failed: ${res.status}`);
  return res.json();
}

async function updateStatus(taskId, status, version) {
  if (!token) await login();
  const res = await fetch(`${config.MAIN_SERVER_URL}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, version }),
  });
  if (res.status === 401) {
    token = null;
    await login();
    return updateStatus(taskId, status, version);
  }
  if (res.status === 409) {
    const err = new Error('Conflict');
    err.statusCode = 409;
    throw err;
  }
  if (!res.ok) throw new Error(`updateStatus failed: ${res.status}`);
  return res.json();
}

module.exports = { login, getAssignedTasks, updateStatus };
