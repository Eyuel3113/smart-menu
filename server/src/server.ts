import http from 'http';
import { createApp } from './app';
import { initSocketIO } from './sockets';
import { ENV } from './config/env';
import prisma from './config/db';

async function bootstrap() {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Bind Socket.io real-time event system
  initSocketIO(httpServer);

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n⚠️ Port ${ENV.PORT} is already in use by another process.\n` +
        `If another server instance is running, you can stop it or run: fuser -k ${ENV.PORT}/tcp\n`
      );
      process.exit(1);
    } else {
      console.error('HTTP server encountered an error:', err);
    }
  });

  const server = httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 Smart Menu Server running in [${ENV.NODE_ENV}] mode on http://localhost:${ENV.PORT}`);
    console.log(`📡 Socket.io real-time server bound and active`);
    console.log(`🔌 Database connected to: ${ENV.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Database disconnected.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
