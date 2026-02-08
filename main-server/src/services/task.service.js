const { v4: uuid } = require('uuid');
const taskRepository = require('../repositories/task.repository');

/**
 * Create a new task assigned to a node.
 * @param {{ task_type: string, task_details: object, assigned_node_id: string }}
 * @returns {Promise<{ task_id: string }>}
 */
async function createTask({ task_type, task_details, assigned_node_id }) {
  const task_id = uuid();
  await taskRepository.insertTask(task_id, task_type, task_details, assigned_node_id);
  console.log('[Task] created', { task_id, task_type, assigned_node_id });
  return { task_id };
}

/**
 * Fetch and lock up to N pending tasks for a node (status -> in_progress).
 * @param {string} nodeId
 * @returns {Promise<Array>} Locked task rows
 */
async function fetchAndLockAssigned(nodeId) {
  const rows = await taskRepository.fetchAndLockAssigned(nodeId);
  if (rows.length > 0) {
    console.log('[Task] assigned fetched', { node_id: nodeId, count: rows.length });
  }
  return rows;
}

/**
 * Update task status (optimistic lock via version).
 * Rejects if task is already in terminal state (completed/failed).
 * @param {string} taskId
 * @param {string} nodeId
 * @param {{ status: string, version: number }}
 * @returns {Promise<{ success: boolean }>}
 * @throws {Error} statusCode 409 when version mismatch / terminal state / idempotent
 */
async function updateStatus(taskId, nodeId, { status, version }) {
  const existing = await taskRepository.getStatusByTaskAndNode(taskId, nodeId);
  if (existing === 'completed' || existing === 'failed') {
    const err = new Error('Task already in terminal state');
    err.statusCode = 409;
    throw err;
  }

  const rowCount = await taskRepository.updateStatus(taskId, nodeId, status, version);
  if (rowCount === 0) {
    const err = new Error('Idempotent / invalid update');
    err.statusCode = 409;
    throw err;
  }
  console.log('[Task] status updated', { task_id: taskId, status, node_id: nodeId });
  return { success: true };
}

/**
 * Reassign a task to another node and reset lock.
 * @param {string} taskId
 * @param {string} new_node_id
 * @returns {Promise<{ success: boolean }>}
 * @throws {Error} statusCode 404 when task not found
 */
async function reassignTask(taskId, new_node_id) {
  const rowCount = await taskRepository.reassign(taskId, new_node_id);
  if (rowCount === 0) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  console.log('[Task] reassigned', { task_id: taskId, new_node_id: new_node_id });
  return { success: true };
}

module.exports = {
  createTask,
  fetchAndLockAssigned,
  updateStatus,
  reassignTask,
};
