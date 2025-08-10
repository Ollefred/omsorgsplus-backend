// routes/staff.cjs (CommonJS)
const express = require('express');

// Välj EN av raderna nedan beroende på vad din modell heter.
// Om din modell är CJS: döp gärna modellen till models/Staff.cjs och använd raden under.
const Staff = require('../models/staff.cjs'); 
// Om din modell är CJS men filen heter Staff.js, använd istället:
// const Staff = require('../models/Staff.js');

const router = express.Router();

// 1) GET /api/staff – Hämta alla
router.get('/', async (req, res) => {
  try {
    const list = await Staff.find();
    res.json(list);
  } catch (err) {
    console.error('Fel vid hämtning av all personal:', err);
    res.status(500).json({ error: 'Serverfel vid hämtning' });
  }
});

// 2) GET /api/staff/:id – Hämta en person
router.get('/:id', async (req, res) => {
  try {
    const person = await Staff.findById(req.params.id);
    if (!person) return res.status(404).json({ error: 'Personal hittades inte' });
    res.json(person);
  } catch (err) {
    console.error('Fel vid hämtning av profil:', err);
    res.status(500).json({ error: 'Serverfel vid hämtning av profil' });
  }
});

// 3) POST /api/staff – Skapa ny
router.post('/', async (req, res) => {
  try {
    const { name, role, experience } = req.body;
    const newStaff = new Staff({
      name,
      role,
      experience,
      rating: 0,
      ratingCount: 0,
      ratings: [],
    });
    const saved = await newStaff.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Fel vid skapande av personal:', err);
    res.status(400).json({ error: err.message });
  }
});

// 4) PUT /api/staff/:id/rating – Uppdatera betyg
router.put('/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Betyg måste vara 1–5' });
    }

    const person = await Staff.findById(req.params.id);
    if (!person) return res.status(404).json({ error: 'Personal hittades inte' });

    person.ratings.push(rating);
    const total = person.ratings.reduce((sum, r) => sum + r, 0);
    person.ratingCount = person.ratings.length;
    person.rating = total / person.ratingCount;

    await person.save();
    res.json({ message: 'Betyg sparat', rating: person.rating, count: person.ratingCount });
  } catch (err) {
    console.error('Fel vid uppdatering av betyg:', err);
    res.status(500).json({ error: 'Serverfel vid uppdatering av betyg' });
  }
});

module.exports = router;
