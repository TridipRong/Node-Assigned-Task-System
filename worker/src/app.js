const config = require('./config');
const api = require('./api');
const poller = require('./poller');

config.validate();

async function main() {
  await api.login();
  console.log('[Worker] started', { node_id: config.NODE_ID, poll_ms: config.POLL_INTERVAL_MS });
  poller.start();
}

function shutdown() {
  console.log('[Worker] Shutting down...');
  poller.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('[Worker] startup failed', { error: err.message });
  process.exit(1);
});
