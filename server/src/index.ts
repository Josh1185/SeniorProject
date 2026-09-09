/**
 * FILE: index.ts
 * DESCRIPTION: The server entry point.
 *              Its only job is to start listening on the specified port and to stop cleanly.
 *
 * LAST UPDATED: 2026-09-08 - File Created (Josh Iehle)
 */

// -------------------- Util Imports --------------------
import { createApp } from './app';
import { env } from './env';

// -------------------- Server Instance --------------------
const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// -------------------- Shutdown Handler --------------------
/**
 * Used for graceful shutdown.
 * Calling 'server.close()' stops accepting new connections and waits for in-flight ones to finish
 */
function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`);
  server.close(() => process.exit(0)); // A clean shutdown

  // If a connection refuses to close, force-exit after 10 seconds
  setTimeout(() => process.exit(1), 10_000).unref(); // NOT a clean shutdown
}

// -------------------- Shutdown Cases --------------------
/**
 * SIGINT is stopping the server with Ctrl-C in the command line
 * SIGTERM is what deployment platforms send before stopping your server container
 */
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
