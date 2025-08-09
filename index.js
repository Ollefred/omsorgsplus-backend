// index.js
require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Test-route för att se att API:t är uppe ---
app.get("/", (req, res) => {
  res.send("OmsorgsPlus API igång!");
});

// --- Importera dina routes ---
const staffRoutes   = require("./routes/staff");
const bookingRoutes = require("./routes/bookings");
const contactRoutes = require("./routes/contact");

// --- Montera dem på rätt endpoints ---
app.use("/api/staff",    staffRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact",  contactRoutes);

// --- Anslut till MongoDB och starta servern ---
const MONGO_URL = process.env.MONGO_URL;
const PORT      = process.env.PORT || 5000;

const path = require("path");

// Servera statiska filer (din frontend)
app.use(express.static(path.join(__dirname, "public")));

// (valfritt) fånga alla icke-API GET:er och skicka index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Ansluten till MongoDB");
    app.listen(PORT, () => {
      console.log(`🌐 Servern kör på port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB-anslutning misslyckades:", err);
  });
