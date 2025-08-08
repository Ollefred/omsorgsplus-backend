// routes/staff.js

const express = require("express");
const router  = express.Router();
const Staff   = require("../models/Staff");

// 1) GET /api/staff – Hämta alla personal
router.get("/", async (req, res) => {
  try {
    const list = await Staff.find();
    res.json(list);
  } catch (err) {
    console.error("Fel vid hämtning av all personal:", err);
    res.status(500).json({ error: "Serverfel vid hämtning" });
  }
});

// 2) GET /api/staff/:id – Hämta en specifik person
router.get("/:id", async (req, res) => {
  try {
    const person = await Staff.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: "Personal hittades inte" });
    }
    res.json(person);
  } catch (err) {
    console.error("Fel vid hämtning av profil:", err);
    res.status(500).json({ error: "Serverfel vid hämtning av profil" });
  }
});

// 3) POST /api/staff – Skapa ny personal
router.post("/", async (req, res) => {
  try {
    const { name, role, experience } = req.body;
    const newStaff = new Staff({
      name,
      role,
      experience,
      rating: 0,
      ratingCount: 0,
      ratings: []
    });
    const saved = await newStaff.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Fel vid skapande av personal:", err);
    res.status(400).json({ error: err.message });
  }
});

// 4) PUT /api/staff/:id/rating – Uppdatera betyg
router.put("/:id/rating", async (req, res) => {
  try {
    const { rating } = req.body;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Betyg måste vara ett tal mellan 1 och 5" });
    }

    const person = await Staff.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: "Personal hittades inte" });
    }

    // Lägg till nya betyget och räkna om snittbetyget
    person.ratings.push(rating);
    const total = person.ratings.reduce((sum, r) => sum + r, 0);
    person.ratingCount = person.ratings.length;
    person.rating      = total / person.ratingCount;

    await person.save();
    res.json({ message: "Betyg sparat", rating: person.rating, count: person.ratingCount });
  } catch (err) {
    console.error("Fel vid uppdatering av betyg:", err);
    res.status(500).json({ error: "Serverfel vid uppdatering av betyg" });
  }
});

module.exports = router;
