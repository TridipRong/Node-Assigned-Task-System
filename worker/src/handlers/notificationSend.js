/**
 * Handler for task_type: notification_send
 * task_details: { channel, message, to } (e.g. push, sms)
 */
async function notification_send(details) {
  console.log('[Worker] notification_send', details);
  // TODO: integrate with push/SMS provider
  return { ok: true };
}

module.exports = { notification_send };
