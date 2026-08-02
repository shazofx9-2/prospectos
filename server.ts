import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDemoData } from './server/seed.js';

// Import routers
import authRouter from './server/routes/auth.js';
import prospectsRouter from './server/routes/prospects.js';
import clientsRouter from './server/routes/clients.js';
import tasksRouter from './server/routes/tasks.js';
import notesRouter from './server/routes/notes.js';
import remindersRouter from './server/routes/reminders.js';
import filesRouter from './server/routes/files.js';
import analyticsRouter from './server/routes/analytics.js';
import settingsRouter from './server/routes/settings.js';
import followupsRouter from './server/routes/followups.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers - configure a high limit (50MB) for base64 file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Seed demo data on boot if needed
  await seedDemoData();

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/prospects', prospectsRouter);
  app.use('/api/clients', clientsRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/follow-ups', followupsRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Serve static assets and frontend bundle based on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve frontend SPA index for all non-api routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProspectOS server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('Failed to start server:', e);
});
