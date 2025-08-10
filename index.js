// index.js (ESM)
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();

// __dirname i ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bas-middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'https://omsorgsplus.se',
    credentials: true,
  })
);

// Health & test
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.send('OmsorgsPlus API igång!'));

// Routes
import staffRoutes from './routes/staff.cjs';
import bookingRoutes from './routes/bookings.js';
import contactRoutes from './routes/contact.js';
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Statiska filer
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
// SPA-fallback för allt utom /api
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// --- Starta servern först ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Servern kör på port ${PORT}`));

// Health (GET + HEAD så Render alltid får 200 snabbt)
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.head('/healthz', (req, res) => res.sendStatus(200));

// --- Anslut MongoDB i bakgrunden, med timeout ---
const { MONGO_URL } = process.env;
if (!MONGO_URL) {
  console.error('❌ MONGO_URL saknas i .env');
} else {
  mongoose
    .connect(MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Ansluten till MongoDB'))
    .catch(err => console.error('❌ MongoDB-anslutning misslyckades:', err));
}

