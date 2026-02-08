const cron = require('node-cron');
const taskRepository = require('../repositories/task.repository');

cron.schedule('* * * * *', async () => {
  const count = await taskRepository.resetTimedOutTasks();
  if (count > 0) {
    console.log('[Cron] tasks timed out, reset to pending', { count });
  }
});
