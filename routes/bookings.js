// routes/bookings.js (ESM)
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

const router = express.Router();

// --- Nodemailer-transporter ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Enkel schema för bokning (oförändrad struktur)
const bookingSchema = new mongoose.Schema({
  staffId: String,
  datetime: Date,
  need: String,
  address: String,
  userEmail: String,
  createdAt: { type: Date, default: Date.now },
});
const Booking = mongoose.model('Booking', bookingSchema);

router.post('/', async (req, res) => {
  try {
    const { staffId, datetime, need, address, userEmail } = req.body;
    const b = new Booking({ staffId, datetime, need, address, userEmail });
    await b.save();

    const mailOptions = {
      from: `"OmsorgsPlus" <${process.env.MAIL_USER}>`,
      to: 'olle@swebsstudio.com',
      subject: `Ny bokning: ${staffId} – ${new Date(datetime).toLocaleString('sv-SE')}`,
      text: `En ny bokning har inkommit:

Medarbetare:  ${staffId}
Behov:        ${need}
Tid & datum:  ${new Date(datetime).toLocaleString('sv-SE')}
Adress:       ${address}
Kundmejl:     ${userEmail}
`,
      html: `<h2>Ny bokning inkommit!</h2>
<ul>
  <li><strong>Medarbetare:</strong> ${staffId}</li>
  <li><strong>Behov:</strong> ${need}</li>
  <li><strong>Tid & datum:</strong> ${new Date(datetime).toLocaleString('sv-SE')}</li>
  <li><strong>Adress:</strong> ${address}</li>
  <li><strong>Kundmejl:</strong> ${userEmail}</li>
</ul>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ success: true, booking: b });
  } catch (err) {
    console.error('❌ Fel vid bokning eller mejlskick:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
