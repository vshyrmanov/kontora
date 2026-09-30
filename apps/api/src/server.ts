import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './db.js';

const config = env();
await connectDb(config.MONGODB_URI);

const server = createApp().listen(config.PORT, () => {
  console.log(`Kontora API: http://localhost:${config.PORT} (${config.NODE_ENV}, ${config.APP_TIMEZONE})`);
});

const shutdown = (signal: string) => {
  console.log(`${signal}: завершення роботи`);
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
