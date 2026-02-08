const api = require('./api');
const executor = require('./executor');
const config = require('./config');

let timeoutId = null;
let isShuttingDown = false;

async function poll() {
  if (isShuttingDown) return;
  try {
    const tasks = await api.getAssignedTasks();
    if (Array.isArray(tasks) && tasks.length > 0) {
      console.log('[Worker] fetched tasks', { count: tasks.length });
      for (const task of tasks) {
        if (isShuttingDown) break;
        await executor.run(task);
      }
    }
  } catch (err) {
    console.error('[Worker] poll error', err.message);
  }
  if (!isShuttingDown) {
    timeoutId = setTimeout(poll, config.POLL_INTERVAL_MS);
  }
}

function start() {
  poll();
}

function stop() {
  isShuttingDown = true;
  if (timeoutId) clearTimeout(timeoutId);
}

module.exports = { start, stop };
