// index.js (stabil healthz + säkerhet + fallback-guard)
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = express();

// __dirname i ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// *** 1) HEALTHZ FÖRST (innan all annan middleware) ***
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));
app.head('/healthz', (req, res) => res.sendStatus(200));

// Bas-inställningar & säkerhet
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
    origin: process.env.FRONTEND_URL || 'https://www.omsorgsplus.se',
    credentials: true,
  })
);

// Test-root (så / alltid ger något även utan frontend)
app.get('/', (req, res) => res.status(200).send('OmsorgsPlus API igång'));

// Routrar (behåll dina som de är)
import staffRoutes from './routes/staff.cjs';
import bookingRoutes from './routes/bookings.js';
import contactRoutes from './routes/contact.js';
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Statiska filer + SPA-fallback endast om fil finns
const publicDir = path.join(__dirname, 'public');
const indexHtml = path.join(publicDir, 'index.html');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
if (fs.existsSync(indexHtml)) {
  app.get(/^\/(?!api|healthz).*/, (req, res) => res.sendFile(indexHtml));
} else {
  app.get(/^\/(?!api|healthz).*/, (req, res) => res.status(200).send('API online'));
}

// Global error handler (fångar oväntade fel)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// *** Starta servern FÖRE DB-koppling ***
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Servern kör på port ${PORT}`));

// Koppla Mongo i bakgrunden (blockera inte healthz)
const { MONGO_URL } = process.env;
if (MONGO_URL) {
  mongoose
    .connect(MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Ansluten till MongoDB'))
    .catch((err) => console.error('❌ MongoDB-anslutning misslyckades:', err));
} else {
  console.error('❌ MONGO_URL saknas');
}
