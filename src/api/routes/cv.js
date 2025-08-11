const express = require('express');
const router = express.Router();
const knex = require('knex')(require('../../../knexfile').development);

// GET /api/cv
router.get('/', async (req, res) => {
  try {
    const cv = await knex('cvs').where({ user_id: req.userId }).first();
    if (cv) {
      res.json(cv);
    } else {
      res.status(404).json({ message: 'CV not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch CV.', details: err.message });
  }
});

// POST /api/cv
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const existingCv = await knex('cvs').where({ user_id: req.userId }).first();
    if (existingCv) {
      await knex('cvs').where({ id: existingCv.id, user_id: req.userId }).update({ content });
    } else {
      await knex('cvs').insert({ content, user_id: req.userId });
    }
    res.status(200).json({ message: 'CV saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save CV.', details: err.message });
  }
});

module.exports = router;