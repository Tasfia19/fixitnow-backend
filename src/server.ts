import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`
  ===========================================
    🔧 FixItNow Server Running
    Port: ${config.port}
    Mode: ${config.nodeEnv}
    Database URL in Use: Configured via Prisma
  ===========================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
