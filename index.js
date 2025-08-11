import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

const app = express();

// Health först (måste alltid svara 200)
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));
app.head('/healthz', (req, res) => res.sendStatus(200));

app.set('trust proxy', 1);
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

app.get('/', (req, res) => res.status(200).send('OmsorgsPlus API igång (phase 2)'));

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


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Starta före DB
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Servern kör på port ${PORT}`));

// DB i bakgrunden
if (process.env.MONGO_URL) {
  mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Ansluten till MongoDB'))
    .catch(err => console.error('❌ MongoDB-anslutning misslyckades:', err));
}
