/**
 * Task entity - DB table definition and response mapping.
 * toResponse() ensures we never leak internal fields in API responses.
 */
const TABLE_NAME = 'tasks';

const COLUMNS = {
  TASK_ID: 'task_id',
  TASK_TYPE: 'task_type',
  TASK_DETAILS: 'task_details',
  ASSIGNED_NODE_ID: 'assigned_node_id',
  STATUS: 'status',
  VERSION: 'version',
  LOCKED_AT: 'locked_at',
  TIMEOUT_AT: 'timeout_at',
  RETRY_COUNT: 'retry_count',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
};

/** Allowed status values for validation */
const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Map DB row to API response shape (single task).
 * @param {object} row - Raw row from pool.query
 * @returns {object} Safe response object
 */
function toResponse(row) {
  if (!row) return null;
  return {
    task_id: row.task_id,
    task_type: row.task_type,
    task_details: row.task_details,
    assigned_node_id: row.assigned_node_id,
    status: row.status,
    version: row.version,
    locked_at: row.locked_at,
    timeout_at: row.timeout_at,
    retry_count: row.retry_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Map array of DB rows to API response.
 * @param {object[]} rows
 * @returns {object[]}
 */
function toListResponse(rows) {
  return (rows || []).map(toResponse);
}

module.exports = {
  TABLE_NAME,
  COLUMNS,
  STATUS,
  toResponse,
  toListResponse,
};
