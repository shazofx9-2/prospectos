import express from 'express';
import authRouter from '../server/routes/auth.js';
import prospectsRouter from '../server/routes/prospects.js';
import clientsRouter from '../server/routes/clients.js';
import tasksRouter from '../server/routes/tasks.js';
import notesRouter from '../server/routes/notes.js';
import remindersRouter from '../server/routes/reminders.js';
import filesRouter from '../server/routes/files.js';
import analyticsRouter from '../server/routes/analytics.js';
import settingsRouter from '../server/routes/settings.js';
import followupsRouter from '../server/routes/followups.js';
import { seedDemoData } from '../server/seed.js';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Seed demo data on cold start if empty
seedDemoData().catch(console.error);

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
