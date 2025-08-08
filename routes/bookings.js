// routes/bookings.js

const express    = require("express");
const router     = express.Router();
const mongoose   = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();  // för att läsa MAIL_USER, MAIL_PASS från .env

// --- Nodemailer-transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",  
  auth: {
    user: process.env.MAIL_USER,    // t.ex. din@gmail.com
    pass: process.env.MAIL_PASS     // ditt app-lösenord eller SMTP-lösenord
  }
});

// Enkel schema för bokning
const bookingSchema = new mongoose.Schema({
  staffId:    String,
  datetime:   Date,
  need:       String,
  address:    String,
  userEmail:  String,
  createdAt:  { type: Date, default: Date.now }
});
const Booking = mongoose.model("Booking", bookingSchema);

router.post("/", async (req, res) => {
  try {
    // 1) Spara bokningen
    const { staffId, datetime, need, address, userEmail } = req.body;
    const b = new Booking({ staffId, datetime, need, address, userEmail });
    await b.save();

    // 2) Bygg upp mejlinnehåll
    const mailOptions = {
      from: `"OmsorgsPlus" <${process.env.MAIL_USER}>`,
      to:   "olle@swebsstudio.com",
      subject: `Ny bokning: ${staffId} – ${new Date(datetime).toLocaleString("sv-SE")}`,
      text:  
`En ny bokning har inkommit:

Medarbetare:  ${staffId}
Behov:        ${need}
Tid & datum:  ${new Date(datetime).toLocaleString("sv-SE")}
Adress:       ${address}
Kundmejl:     ${userEmail}
`,
      html:
`<h2>Ny bokning inkommit!</h2>
<ul>
  <li><strong>Medarbetare:</strong> ${staffId}</li>
  <li><strong>Behov:</strong> ${need}</li>
  <li><strong>Tid & datum:</strong> ${new Date(datetime).toLocaleString("sv-SE")}</li>
  <li><strong>Adress:</strong> ${address}</li>
  <li><strong>Kundmejl:</strong> ${userEmail}</li>
</ul>`
    };

    // 3) Skicka mejlet
    await transporter.sendMail(mailOptions);

    // 4) Svara front-end
    res.status(201).json({ success: true, booking: b });
  } catch (err) {
    console.error("❌ Fel vid bokning eller mejlskick:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
