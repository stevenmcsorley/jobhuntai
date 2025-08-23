const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const knex = require('knex')(require('../../../knexfile').development);
const { authenticateToken } = require('../../middleware/auth');
const cvVersioning = require('../../services/cvVersioning');
const pdfExporter = require('../../services/pdfExporter');
const cvAnalyzer = require('../../services/cvAnalyzer');

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
    const cv = await cvVersioning.getCurrentCv(req.user.id);
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
    const { content, changeSummary } = req.body;
    const newCv = await cvVersioning.updateCvWithVersion(
      req.user.id, 
      content, 
      'editor',
      changeSummary || 'Manual edit in CV Editor'
    );
    res.status(200).json({ 
      message: 'CV saved successfully.',
      version: newCv.version,
      cvId: newCv.id
    });
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

      // Save to database with versioning
      const newCv = await cvVersioning.updateCvWithVersion(
        req.user.id,
        extractedText,
        'upload',
        `Uploaded ${fileExtension} file: ${req.file.originalname}`
      );

      res.json({ 
        message: 'CV uploaded and processed successfully',
        content: extractedText,
        version: newCv.version,
        cvId: newCv.id
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

// GET /api/cv/history - Get CV version history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await cvVersioning.getCvHistory(req.user.id, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch CV history.', details: err.message });
  }
});

// GET /api/cv/versions/:version - Get specific CV version
router.get('/versions/:version', async (req, res) => {
  try {
    const version = parseInt(req.params.version);
    const cv = await cvVersioning.getCvVersion(req.user.id, version);
    if (cv) {
      res.json(cv);
    } else {
      res.status(404).json({ message: 'CV version not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch CV version.', details: err.message });
  }
});

// GET /api/cv/templates - Get available CV templates
router.get('/templates', (req, res) => {
  try {
    const templates = pdfExporter.getAvailableTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates.', details: err.message });
  }
});

// POST /api/cv/export/pdf - Export current CV as PDF
router.post('/export/pdf', async (req, res) => {
  try {
    const { template = 'professional', filename } = req.body;
    
    // Get current CV
    const cv = await cvVersioning.getCurrentCv(req.user.id);
    if (!cv) {
      return res.status(404).json({ error: 'No CV found to export' });
    }

    // Generate PDF
    const pdfBuffer = await pdfExporter.exportFromText(cv.content, template);
    
    // Set response headers
    const exportFilename = filename || `CV_${req.user.name || 'User'}_v${cv.version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export CV as PDF.', details: err.message });
  }
});

// POST /api/cv/export/docx - Export current CV as DOCX
router.post('/export/docx', async (req, res) => {
  try {
    const { template = 'professional', filename } = req.body;
    
    // Get current CV
    const cv = await cvVersioning.getCurrentCv(req.user.id);
    if (!cv) {
      return res.status(404).json({ error: 'No CV found to export' });
    }

    // Parse text to structured data and export as DOCX
    const structuredCv = pdfExporter.parseTextToCv(cv.content);
    const docxBuffer = await pdfExporter.exportAsDocx(structuredCv, template);
    
    // Set response headers
    const exportFilename = filename || `CV_${req.user.name || 'User'}_v${cv.version}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    
    res.send(docxBuffer);
  } catch (err) {
    console.error('DOCX export error:', err);
    res.status(500).json({ error: 'Failed to export CV as DOCX.', details: err.message });
  }
});

// POST /api/cv/export/html - Export current CV as HTML
router.post('/export/html', async (req, res) => {
  try {
    const { template = 'professional', filename } = req.body;
    
    // Get current CV
    const cv = await cvVersioning.getCurrentCv(req.user.id);
    if (!cv) {
      return res.status(404).json({ error: 'No CV found to export' });
    }

    // Parse text to structured data and export as HTML
    const structuredCv = pdfExporter.parseTextToCv(cv.content);
    const htmlContent = pdfExporter.exportAsHtml(structuredCv, template);
    
    // Set response headers
    const exportFilename = filename || `CV_${req.user.name || 'User'}_v${cv.version}.html`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(htmlContent, 'utf8'));
    
    res.send(htmlContent);
  } catch (err) {
    console.error('HTML export error:', err);
    res.status(500).json({ error: 'Failed to export CV as HTML.', details: err.message });
  }
});

// POST /api/cv/versions/:version/export/pdf - Export specific CV version as PDF
router.post('/versions/:version/export/pdf', async (req, res) => {
  try {
    const version = parseInt(req.params.version);
    const { template = 'professional', filename } = req.body;
    
    // Get specific CV version
    const cv = await cvVersioning.getCvVersion(req.user.id, version);
    if (!cv) {
      return res.status(404).json({ error: 'CV version not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfExporter.exportFromText(cv.content, template);
    
    // Set response headers
    const exportFilename = filename || `CV_${req.user.name || 'User'}_v${version}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export CV version as PDF.', details: err.message });
  }
});

// POST /api/cv/analyze - Analyze current CV and provide suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { force = false } = req.body;
    const analysis = await cvAnalyzer.analyzeCv(req.user.id, null, force);
    res.json(analysis);
  } catch (err) {
    console.error('CV analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze CV.', details: err.message });
  }
});

// GET /api/cv/analyze/status - Check analysis status and detect changes
router.get('/analyze/status', async (req, res) => {
  try {
    const changeDetection = await cvAnalyzer.detectChanges(req.user.id);
    const latestAnalysis = await cvAnalyzer.getLatestAnalysis(req.user.id);
    
    res.json({
      change_detection: changeDetection,
      latest_analysis: latestAnalysis ? {
        analyzed_at: latestAnalysis.analyzed_at,
        expires_at: latestAnalysis.expires_at,
        version: latestAnalysis.version,
        overall_score: latestAnalysis.overall_score,
        ats_score: latestAnalysis.ats_score
      } : null,
      needs_analysis: changeDetection.needsAnalysis
    });
  } catch (err) {
    console.error('Analysis status error:', err);
    res.status(500).json({ error: 'Failed to check analysis status.', details: err.message });
  }
});

// GET /api/cv/analyze/latest - Get latest analysis results
router.get('/analyze/latest', async (req, res) => {
  try {
    const analysis = await cvAnalyzer.getLatestAnalysis(req.user.id);
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found. Run an analysis first.' });
    }
    res.json(analysis);
  } catch (err) {
    console.error('Latest analysis error:', err);
    res.status(500).json({ error: 'Failed to get latest analysis.', details: err.message });
  }
});

// POST /api/cv/analyze/job-specific - Get CV optimization suggestions for a specific job
router.post('/analyze/job-specific', async (req, res) => {
  try {
    const { jobTitle, company, description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const jobData = {
      title: jobTitle || 'Position',
      company: company || 'Company',
      description
    };

    const suggestions = await cvAnalyzer.getJobOptimizationSuggestions(req.user.id, jobData);
    res.json(suggestions);
  } catch (err) {
    console.error('Job-specific analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze CV for job.', details: err.message });
  }
});

// GET /api/cv/analyze/compare/:version1/:version2 - Compare two CV versions
router.get('/analyze/compare/:version1/:version2', async (req, res) => {
  try {
    const version1 = parseInt(req.params.version1);
    const version2 = parseInt(req.params.version2);
    
    if (isNaN(version1) || isNaN(version2)) {
      return res.status(400).json({ error: 'Invalid version numbers' });
    }

    const comparison = await cvAnalyzer.compareVersions(req.user.id, version1, version2);
    res.json(comparison);
  } catch (err) {
    console.error('Version comparison error:', err);
    res.status(500).json({ error: 'Failed to compare CV versions.', details: err.message });
  }
});

// GET /api/cv/analyze/progress - Track CV improvement progress
router.get('/analyze/progress', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const progress = await cvAnalyzer.trackProgress(req.user.id, days);
    res.json(progress);
  } catch (err) {
    console.error('Progress tracking error:', err);
    res.status(500).json({ error: 'Failed to track CV progress.', details: err.message });
  }
});

// DELETE /api/cv/analyze/cache - Clear analysis cache
router.delete('/analyze/cache', async (req, res) => {
  try {
    const cleaned = await cvAnalyzer.cleanupExpiredCache();
    res.json({ 
      message: 'Cache cleanup completed', 
      expired_entries_removed: cleaned 
    });
  } catch (err) {
    console.error('Cache cleanup error:', err);
    res.status(500).json({ error: 'Failed to cleanup cache.', details: err.message });
  }
});

// GET /api/cv/analyze/insights - Get intelligent career insights
router.get('/analyze/insights', async (req, res) => {
  try {
    const insights = await cvAnalyzer.generateCareerInsights(req.user.id);
    res.json(insights);
  } catch (err) {
    console.error('Career insights error:', err);
    res.status(500).json({ error: 'Failed to generate career insights.', details: err.message });
  }
});

module.exports = router;