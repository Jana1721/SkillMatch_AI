import express from 'express';
import cors from 'cors';
import { initDatabase } from '../server/db/database.js';
import apiRouter from '../server/routes/api.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SkillMatch AI Production Engine (Vercel Serverless)',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Lazy-initialize DB on cold start
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (e) {
      console.error('[DB Init Error]', e);
    }
  }
  next();
});

// Mount Central API Router
app.use('/api', apiRouter);

export default app;
