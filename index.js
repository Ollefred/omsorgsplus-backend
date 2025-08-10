// index.js (ESM, Express 5-kompatibel)
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cors from 'cors';

app.set('trust proxy', 1);
app.use(helmet());
app.use(rateLimit({ windowMs: 15*60*1000, limit: 300, standardHeaders: true }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://omsorgsplus.se', credentials: true }));

// healthcheck
app.get('/healthz', (req, res) => res.json({ ok: true }));


// --- __dirname/__filename i ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Health/test ---
app.get('/', (req, res) => {
  res.send('OmsorgsPlus API igång!');
});

// --- Routes ---
import staffRoutes from './routes/staff.cjs';
import bookingRoutes from './routes/bookings.js';
import contactRoutes from './routes/contact.js';

app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// --- Statiska filer ---
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// --- SPA-fallback (utan path-to-regexp-fel) ---
// Matcha alla vägar som INTE börjar med /api
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// --- Start / DB ---
const { MONGO_URL, PORT = 5000 } = process.env;

if (!MONGO_URL) {
  console.error('❌ MONGO_URL saknas i .env');
  process.exit(1);
}

try {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Ansluten till MongoDB');
  app.listen(PORT, () => {
    console.log(`🌐 Servern kör på port ${PORT}`);
  });
} catch (err) {
  console.error('❌ MongoDB-anslutning misslyckades:', err);
  process.exit(1);
}
