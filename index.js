// index.js – stabil, med CSP, HTTPS-redirect och statiska filer
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// === 3) Helmet med CSP som tillåter Tailwind-CDN, jsDelivr (Flatpickr), Google Maps och inline ===
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // allt annat utgår från self
        "default-src": ["'self'"],

        // JS – tillåt Tailwind-CDN + Maps + inline + jsDelivr (Flatpickr)
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://cdn.jsdelivr.net"
        ],
        "script-src-elem": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://cdn.jsdelivr.net"
        ],

        // CSS & typsnitt (Google Fonts och jsDelivr CSS om du använder det)
        "style-src": ["'self'", "'unsafe-inline'", "https:", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],

        // Bilder + fetch/AJAX
        "img-src": ["'self'", "https:", "data:"],
        // Tillåt API-anrop över https + egen origin
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

// CORS – gör enkelt först (lås med origin i prod om du vill)
const corsOrigin = process.env.CORS_ORIGIN || true; // true = tillåt alla (dev)
app.use(cors({ origin: corsOrigin, credentials: true }));

// === 5) Statiska filer (Vite buildade filer eller ren HTML) ===
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
await loadRoutes();

// 404 för okända API-vägar
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// === 7) Felhanterare ===
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
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
