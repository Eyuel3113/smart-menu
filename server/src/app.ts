import express, { Application } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // CORS configuration (supports local network mobile access)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl/mobile) or any local/LAN IP
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-table-token'],
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRouter);

  // 404 and Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
