import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import { InterviewService } from './microservices/interview/interview.service';
import { CalendarService } from './microservices/calendar/calendar.service';
import { EmailService } from './microservices/email/email.service';

async function main() {
  // Initialize Express app
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Initialize Redis client
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  await redis.connect();

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  // Initialize microservices
  const services = [
    new InterviewService(app, io, redis),
    new CalendarService(app, io, redis),
    new EmailService(app, io, redis)
  ];

  // Initialize all services
  await Promise.all(services.map(service => service.initialize()));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start server
  const port = process.env.PORT || 3001;
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Cleaning up...');
    await Promise.all(services.map(service => service.cleanup()));
    await redis.quit();
    process.exit(0);
  });
}

main().catch(console.error);