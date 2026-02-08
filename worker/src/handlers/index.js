const { email_send } = require('./emailSend');
const { notification_send } = require('./notificationSend');
const { report_generate } = require('./reportGenerate');

const registry = {
  email_send,
  notification_send,
  report_generate,
};

function getHandler(taskType) {
  const fn = registry[taskType];
  if (fn) return fn;
  return async (details) => {
    console.warn(`[Worker] No handler for task_type="${taskType}", marking failed`);
    throw new Error(`Unknown task_type: ${taskType}`);
  };
}

module.exports = { getHandler };
