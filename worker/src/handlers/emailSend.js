/**
 * Example handler for task_type: email_send
 * task_details: { to, subject, body } (or similar)
 */
async function email_send(details) {
  console.log('[Worker] email_send', details);
  // TODO: integrate with mailer (nodemailer, etc.)
  return { ok: true };
}

module.exports = { email_send };
