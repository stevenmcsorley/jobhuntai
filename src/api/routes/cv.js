const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const knex = require('knex')(require('../../../knexfile').development);
const { authenticateToken } = require('../../middleware/auth');

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Use authentication middleware to get actual user ID
router.use(authenticateToken);

// GET /api/cv
router.get('/', async (req, res) => {
  try {
    const cv = await knex('cvs').where({ user_id: req.user.id }).first();
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
    const existingCv = await knex('cvs').where({ user_id: req.user.id }).first();
    if (existingCv) {
      await knex('cvs').where({ id: existingCv.id, user_id: req.user.id }).update({ content });
    } else {
      await knex('cvs').insert({ content, user_id: req.user.id });
    }
    res.status(200).json({ message: 'CV saved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save CV.', details: err.message });
  }
});

// POST /api/cv/upload - Handle file uploads
router.post('/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    try {
      switch (fileExtension) {
        case '.pdf':
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdf(pdfBuffer);
          extractedText = pdfData.text;
          break;

        case '.doc':
        case '.docx':
          const docResult = await mammoth.extractRawText({ path: filePath });
          extractedText = docResult.value;
          break;

        case '.txt':
          extractedText = fs.readFileSync(filePath, 'utf8');
          break;

        default:
          return res.status(400).json({ error: 'Unsupported file type' });
      }

      // Clean up extracted text
      extractedText = extractedText.trim();
      
      if (!extractedText) {
        return res.status(400).json({ error: 'No text could be extracted from the file' });
      }

      // Save to database
      const existingCv = await knex('cvs').where({ user_id: req.user.id }).first();
      if (existingCv) {
        await knex('cvs').where({ id: existingCv.id, user_id: req.user.id }).update({ content: extractedText });
      } else {
        await knex('cvs').insert({ content: extractedText, user_id: req.user.id });
      }

      res.json({ 
        message: 'CV uploaded and processed successfully',
        content: extractedText 
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      res.status(400).json({ 
        error: 'Failed to parse file content',
        details: parseError.message 
      });
    }

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: 'Failed to process CV upload',
      details: err.message 
    });
  } finally {
    // Clean up uploaded file
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
  }
});

module.exports = router;