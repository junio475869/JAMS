import express from 'express';
import { createServer } from 'http';
import { createTables } from './config/migrations';
import applicationRoutes from './routes/application.routes';
import adminRoutes from './routes/admin.routes';
import { setupTeamRoutes } from './routes/team.routes';

const app = express();
app.use(express.json());

// Run migrations
createTables().catch(console.error);

app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
setupTeamRoutes(app);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

const server = createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;