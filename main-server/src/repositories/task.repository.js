const pool = require('../db');

const TASK_LOCK_MINUTES = parseInt(process.env.TASK_TIMEOUT_MINUTES, 10) || 5;
const MAX_TASKS_FETCH = 5;

async function insertTask(taskId, taskType, taskDetails, assignedNodeId) {
  await pool.query(
    `INSERT INTO tasks (task_id, task_type, task_details, assigned_node_id, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [taskId, taskType, taskDetails, assignedNodeId]
  );
}

async function fetchAndLockAssigned(nodeId) {
  const result = await pool.query(
    `UPDATE tasks
     SET status = 'in_progress',
         locked_at = now(),
         timeout_at = now() + interval '${TASK_LOCK_MINUTES} minutes',
         version = version + 1
     WHERE task_id IN (
       SELECT task_id FROM tasks
       WHERE assigned_node_id = $1 AND status = 'pending'
       LIMIT ${MAX_TASKS_FETCH}
     )
     RETURNING *`,
    [nodeId]
  );
  return result.rows;
}

async function getStatusByTaskAndNode(taskId, nodeId) {
  const result = await pool.query(
    'SELECT status FROM tasks WHERE task_id = $1 AND assigned_node_id = $2',
    [taskId, nodeId]
  );
  return result.rowCount > 0 ? result.rows[0].status : null;
}

async function updateStatus(taskId, nodeId, status, version) {
  const result = await pool.query(
    `UPDATE tasks
     SET status = $1, version = version + 1, updated_at = now(), locked_at = NULL
     WHERE task_id = $2
       AND assigned_node_id = $3
       AND version = $4`,
    [status, taskId, nodeId, version]
  );
  return result.rowCount;
}

async function reassign(taskId, newNodeId) {
  const result = await pool.query(
    `UPDATE tasks
     SET assigned_node_id = $1,
         status = 'pending',
         locked_at = NULL,
         timeout_at = NULL,
         version = version + 1
     WHERE task_id = $2`,
    [newNodeId, taskId]
  );
  return result.rowCount;
}

async function resetTimedOutTasks() {
  const result = await pool.query(
    `UPDATE tasks
     SET status = 'pending',
         locked_at = NULL,
         timeout_at = NULL,
         retry_count = retry_count + 1,
         version = version + 1
     WHERE status = 'in_progress'
       AND timeout_at < now()`
  );
  return result.rowCount;
}

module.exports = {
  insertTask,
  fetchAndLockAssigned,
  getStatusByTaskAndNode,
  updateStatus,
  reassign,
  resetTimedOutTasks,
};
