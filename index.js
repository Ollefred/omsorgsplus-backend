// index.js – stabil, med CSP för Tailwind + Maps och HTTPS-redirect
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = express();

// === 1) Health först (måste alltid svara 200) ===
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));
app.head('/healthz', (req, res) => res.sendStatus(200));

// === 2) Basinställningar ===
app.set('trust proxy', 1);
app.use(express.json());

// (valfritt men rekommenderat) – tvinga https i prod, men låt /healthz vara orörd
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.path === '/healthz') return next();
    const proto = req.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
  }
  next();
});

// === 3) Helmet med CSP som tillåter Tailwind-CDN, inline script och Google Maps ===
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // allt annat utgår från self
        "default-src": ["'self'"],

        // JS – tillåt Tailwind-CDN + ev. Maps + inline (du har inline-script)
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com"
        ],
        "script-src-elem": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com"
        ],

        // CSS & typsnitt (Google Fonts om du använder det)
        "style-src": ["'self'", "'unsafe-inline'", "https:", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],

        // Bilder + fetch/ajaxi
        "img-src": ["'self'", "https:", "data:"],
        "connect-src": ["'self'", "https:"],

        // Iframes (Google Maps embed)
        "frame-src": ["'self'", "https://www.google.com", "https://maps.google.com", "https://www.google.com/maps"],

        // (lite stramare policy i övrigt)
        "base-uri": ["'self'"],
        "form-action": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// === 4) Övriga middlewares ===
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  })
);

// === 5) Statiska filer från /public + SPA-fallback ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const indexHtml = path.join(publicDir, 'index.html');

// Servera allt i /public (index.html, booking.html, bilder, js, css)
app.use(express.static(publicDir));

// Fallback: alla icke-API/healthz-vägar -> index.html om den finns
app.get(/^\/(?!api|healthz).*/, (req, res) => {
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  return res.status(200).send('API online');
});

// === 6) API-routrar (guardad inladdning) ===
const loadRoutes = async () => {
  try {
    const staff = await import('./routes/staff.cjs');
    app.use('/api/staff', staff.default || staff);
  } catch (e) {
    console.error('Kunde inte ladda /api/staff:', e);
  }
  try {
    const bookings = await import('./routes/bookings.js');
    app.use('/api/bookings', bookings.default || bookings);
  } catch (e) {
    console.error('Kunde inte ladda /api/bookings:', e);
  }
  try {
    const contact = await import('./routes/contact.js');
    app.use('/api/contact', contact.default || contact);
  } catch (e) {
    console.error('Kunde inte ladda /api/contact:', e);
  }
};
loadRoutes();

// === 7) Global error handler ===
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// === 8) Starta servern (före DB-koppling) ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Servern kör på port ${PORT}`));

// === 9) Koppla Mongo i bakgrunden (blockera inte healthz) ===
if (process.env.MONGO_URL) {
  mongoose
    .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Ansluten till MongoDB'))
    .catch((err) => console.error('❌ MongoDB-anslutning misslyckades:', err));
} else {
  console.error('❌ MONGO_URL saknas');
}
