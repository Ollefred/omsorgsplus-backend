// routes/contact.js

const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

// SMTP-konfiguration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,   // din Gmail-adress i .env
    pass: process.env.MAIL_PASS    // ditt app-lösenord i .env
  }
});

// GET /api/contact — för att testa att routern är aktiv
router.get("/", (req, res) => {
  res.json({ success: true, message: "Kontakt-router aktiv" });
});

// POST /api/contact — ta emot förfrågningar och mejla dem
router.post("/", async (req, res) => {
  const { name, email, question } = req.body;

  // Enkel validering
  if (!name || !email || !question) {
    return res.status(400).json({
      success: false,
      error: "name, email och question är obligatoriska fält."
    });
  }

  // Förbered mejlet
  const mailOptions = {
    from:    `"OmsorgsPlus Förfrågningar" <${process.env.MAIL_USER}>`,
    to:      "olle@swebsstudio.com",
    subject: `Ny fråga från ${name}`,
    text: 
`En ny fråga inkommit!
  
Namn:   ${name}
E-post: ${email}

Fråga:
${question}
`,
    html:
`<h2>Ny fråga inkommit!</h2>
<ul>
  <li><strong>Namn:</strong> ${name}</li>
  <li><strong>E-post:</strong> ${email}</li>
</ul>
<p><strong>Fråga:</strong><br>${question}</p>`
  };

  try {
    // Skicka mejl
    const info = await transporter.sendMail(mailOptions);
    console.log("Kontakt-mejl skickat, messageId:", info.messageId);

    // Svara front-end
    res.status(201).json({ success: true, message: "Mejl skickat!" });
  } catch (err) {
    console.error("Fel vid mejl-utskick:", err);
    res.status(500).json({
      success: false,
      error: "Kunde inte skicka mejl, försök igen senare."
    });
  }
});

module.exports = router;
