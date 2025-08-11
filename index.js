import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';

const app = express();

// Test-endpoints som alltid ska funka
app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));
app.get('/', (req, res) => res.status(200).send('OmsorgsPlus API igång (minimal)'));

// Starta servern direkt
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Servern kör på port ${PORT}`));

// Koppla DB i bakgrunden (ska inte blocka healthz)
const { MONGO_URL } = process.env;
if (MONGO_URL) {
  mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Ansluten till MongoDB'))
    .catch(err => console.error('❌ MongoDB-anslutning misslyckades:', err));
}
