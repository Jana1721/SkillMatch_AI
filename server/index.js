import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import apiRouter from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CareerLens AI Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Central API Router
app.use('/api', apiRouter);

// Initialize DB and launch server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[CareerLens AI] Production API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[CareerLens DB Init Failed]', err);
    process.exit(1);
  });
