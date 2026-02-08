const api = require('./api');
const { getHandler } = require('./handlers');

/**
 * Run a single task: execute handler by task_type, then PATCH status (completed | failed).
 */
async function run(task) {
  const { task_id, task_type, task_details, version } = task;
  const handler = getHandler(task_type);
  try {
    await handler(task_details || {});
    await api.updateStatus(task_id, 'completed', version);
    console.log('[Worker] task completed', { task_id, task_type });
  } catch (err) {
    console.error('[Worker] task failed', { task_id, task_type, error: err.message });
    await api.updateStatus(task_id, 'failed', version).catch(() => {});
  }
}

module.exports = { run };
