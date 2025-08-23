const { jsPDF } = require('jspdf');
const Handlebars = require('handlebars');
const fs = require('fs/promises');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

/**
 * PDF Export Service
 * Generates professional CVs in PDF format from both CV Editor and Master Profile data
 */

class PDFExporter {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize CV templates
   */
  async initializeTemplates() {
    // Professional template styles
    this.templates.set('professional', {
      name: 'Professional',
      description: 'Clean, ATS-friendly design for corporate environments',
      colors: { primary: '#2c3e50', secondary: '#34495e', text: '#333333' },
      fonts: { header: 'Arial', body: 'Arial' }
    });

    this.templates.set('modern', {
      name: 'Modern',
      description: 'Contemporary design with subtle colors',
      colors: { primary: '#3498db', secondary: '#2980b9', text: '#2c3e50' },
      fonts: { header: 'Arial', body: 'Arial' }
    });

    this.templates.set('minimal', {
      name: 'Minimal',
      description: 'Ultra-clean design focused on content',
      colors: { primary: '#000000', secondary: '#666666', text: '#333333' },
      fonts: { header: 'Arial', body: 'Arial' }
    });
  }

  /**
   * Export CV from raw text (CV Editor)
   * @param {string} cvText - Raw CV text
   * @param {string} template - Template name
   * @param {Object} options - Export options
   * @returns {Buffer} PDF buffer
   */
  async exportFromText(cvText, template = 'professional', options = {}) {
    const parsedCv = this.parseTextToCv(cvText);
    return await this.generatePDF(parsedCv, template, options);
  }

  /**
   * Export CV from structured profile data (Master Profile)
   * @param {Object} profileData - Structured profile data
   * @param {string} template - Template name
   * @param {Object} options - Export options
   * @returns {Buffer} PDF buffer
   */
  async exportFromProfile(profileData, template = 'professional', options = {}) {
    const structuredCv = this.profileToCv(profileData);
    return await this.generatePDF(structuredCv, template, options);
  }

  /**
   * Parse raw text into structured CV data
   * @param {string} text - Raw CV text
   * @returns {Object} Structured CV data
   */
  parseTextToCv(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Simple parsing logic - can be enhanced with AI later
    const cv = {
      name: '',
      email: '',
      phone: '',
      summary: '',
      experience: [],
      education: [],
      skills: []
    };

    let currentSection = null;
    let currentItem = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect sections
      if (trimmed.match(/^(EXPERIENCE|WORK|EMPLOYMENT)/i)) {
        currentSection = 'experience';
        continue;
      } else if (trimmed.match(/^(EDUCATION|ACADEMIC)/i)) {
        currentSection = 'education';
        continue;
      } else if (trimmed.match(/^(SKILLS|TECHNICAL)/i)) {
        currentSection = 'skills';
        continue;
      } else if (trimmed.match(/^(SUMMARY|PROFILE|ABOUT)/i)) {
        currentSection = 'summary';
        continue;
      }

      // Extract contact info
      if (trimmed.includes('@') && !cv.email) {
        cv.email = trimmed.match(/[\\w.-]+@[\\w.-]+\\.\\w+/)?.[0] || '';
      }
      if (trimmed.match(/\\+?[\\d\\s\\-\\(\\)]+/) && !cv.phone) {
        cv.phone = trimmed;
      }
      if (!cv.name && trimmed.length > 0 && !trimmed.includes('@') && !trimmed.match(/\\d/)) {
        cv.name = trimmed;
      }

      // Process sections
      if (currentSection === 'skills' && trimmed) {
        cv.skills.push(trimmed);
      } else if (currentSection === 'summary' && trimmed) {
        cv.summary += (cv.summary ? ' ' : '') + trimmed;
      }
    }

    return cv;
  }

  /**
   * Convert profile data to CV structure
   * @param {Object} profileData - Master profile data
   * @returns {Object} CV structure
   */
  profileToCv(profileData) {
    const { profile, skills, work_experiences, projects, education } = profileData;

    return {
      name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      linkedin: profile?.linkedin_url || '',
      github: profile?.github_url || '',
      summary: profile?.summary || '',
      experience: work_experiences?.map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: exp.start_date,
        endDate: exp.end_date || 'Present',
        highlights: exp.highlights?.map(h => h.highlight_text) || []
      })) || [],
      projects: projects?.map(proj => ({
        name: proj.project_name,
        role: proj.role,
        startDate: proj.start_date,
        endDate: proj.end_date || 'Present',
        highlights: proj.highlights?.map(h => h.highlight_text) || []
      })) || [],
      education: education?.map(edu => ({
        degree: edu.degree,
        field: edu.field_of_study,
        institution: edu.institution,
        graduationDate: edu.graduation_date
      })) || [],
      skills: skills?.map(s => s.skill_name) || []
    };
  }

  /**
   * Generate PDF from structured CV data
   * @param {Object} cvData - Structured CV data
   * @param {string} templateName - Template name
   * @param {Object} options - Export options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(cvData, templateName = 'professional', options = {}) {
    const template = this.templates.get(templateName) || this.templates.get('professional');
    
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;
    
    // Set colors from template
    const colors = template.colors;
    
    // Helper functions
    const addText = (text, x, y, options = {}) => {
      doc.setFontSize(options.fontSize || 11);
      doc.setTextColor(options.color || colors.text);
      doc.setFont(options.font || 'helvetica', options.style || 'normal');
      doc.text(text, x, y);
      return doc.getTextDimensions(text).h;
    };

    const addLine = (y, color = colors.secondary) => {
      doc.setDrawColor(color);
      doc.line(15, y, pageWidth - 15, y);
    };

    const checkPageBreak = (requiredSpace = 20) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
    };

    // Header - Name
    if (cvData.name) {
      doc.setFontSize(24);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(cvData.name, 15, currentY);
      currentY += 10;
    }

    // Contact Info
    let contactInfo = [];
    if (cvData.email) contactInfo.push(cvData.email);
    if (cvData.phone) contactInfo.push(cvData.phone);
    if (cvData.linkedin) contactInfo.push(cvData.linkedin);
    if (cvData.github) contactInfo.push(cvData.github);

    if (contactInfo.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(colors.text);
      doc.setFont('helvetica', 'normal');
      doc.text(contactInfo.join(' | '), 15, currentY);
      currentY += 8;
    }

    // Separator line
    addLine(currentY);
    currentY += 10;

    // Summary
    if (cvData.summary) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL SUMMARY', 15, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(colors.text);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(cvData.summary, pageWidth - 30);
      doc.text(summaryLines, 15, currentY);
      currentY += summaryLines.length * 5 + 8;
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL EXPERIENCE', 15, currentY);
      currentY += 10;

      for (const exp of cvData.experience) {
        checkPageBreak(25);
        
        // Job title and company
        doc.setFontSize(12);
        doc.setTextColor(colors.text);
        doc.setFont('helvetica', 'bold');
        doc.text(`${exp.title} | ${exp.company}`, 15, currentY);
        currentY += 6;

        // Date and location
        doc.setFontSize(10);
        doc.setTextColor(colors.secondary);
        doc.setFont('helvetica', 'italic');
        doc.text(`${exp.startDate} - ${exp.endDate}${exp.location ? ' | ' + exp.location : ''}`, 15, currentY);
        currentY += 8;

        // Highlights
        if (exp.highlights && exp.highlights.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(colors.text);
          doc.setFont('helvetica', 'normal');
          
          for (const highlight of exp.highlights.slice(0, 5)) { // Limit to 5 highlights
            checkPageBreak(10);
            const bulletLines = doc.splitTextToSize(`• ${highlight}`, pageWidth - 35);
            doc.text(bulletLines, 20, currentY);
            currentY += bulletLines.length * 4 + 2;
          }
        }
        currentY += 5;
      }
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCATION', 15, currentY);
      currentY += 10;

      for (const edu of cvData.education) {
        checkPageBreak(15);
        
        doc.setFontSize(11);
        doc.setTextColor(colors.text);
        doc.setFont('helvetica', 'bold');
        doc.text(`${edu.degree} in ${edu.field}`, 15, currentY);
        currentY += 5;

        doc.setFontSize(10);
        doc.setTextColor(colors.secondary);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.institution} | ${edu.graduationDate}`, 15, currentY);
        currentY += 8;
      }
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('TECHNICAL SKILLS', 15, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setTextColor(colors.text);
      doc.setFont('helvetica', 'normal');
      const skillsText = cvData.skills.join(' • ');
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 30);
      doc.text(skillsLines, 15, currentY);
      currentY += skillsLines.length * 4;
    }

    // Return PDF buffer
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Export CV as DOCX format
   * @param {Object} cvData - Structured CV data
   * @param {string} templateName - Template name
   * @returns {Buffer} DOCX buffer
   */
  async exportAsDocx(cvData, templateName = 'professional') {
    const template = this.templates.get(templateName) || this.templates.get('professional');
    
    const sections = [];

    // Header section with name and contact
    if (cvData.name) {
      sections.push(
        new Paragraph({
          text: cvData.name,
          heading: HeadingLevel.TITLE,
          alignment: 'center'
        })
      );
    }

    // Contact info
    let contactInfo = [];
    if (cvData.email) contactInfo.push(cvData.email);
    if (cvData.phone) contactInfo.push(cvData.phone);
    if (cvData.linkedin) contactInfo.push(cvData.linkedin);
    if (cvData.github) contactInfo.push(cvData.github);

    if (contactInfo.length > 0) {
      sections.push(
        new Paragraph({
          text: contactInfo.join(' | '),
          alignment: 'center'
        })
      );
    }

    // Summary
    if (cvData.summary) {
      sections.push(
        new Paragraph({
          text: 'PROFESSIONAL SUMMARY',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: cvData.summary
        })
      );
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      sections.push(
        new Paragraph({
          text: 'PROFESSIONAL EXPERIENCE',
          heading: HeadingLevel.HEADING_1
        })
      );

      for (const exp of cvData.experience) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${exp.title} | ${exp.company}`, bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${exp.startDate} - ${exp.endDate}${exp.location ? ' | ' + exp.location : ''}`,
                italics: true 
              })
            ]
          })
        );

        if (exp.highlights) {
          for (const highlight of exp.highlights.slice(0, 5)) {
            sections.push(
              new Paragraph({
                text: `• ${highlight}`,
                indent: { left: 720 } // 0.5 inch
              })
            );
          }
        }
      }
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      sections.push(
        new Paragraph({
          text: 'EDUCATION',
          heading: HeadingLevel.HEADING_1
        })
      );

      for (const edu of cvData.education) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${edu.degree} in ${edu.field}`, bold: true })
            ]
          }),
          new Paragraph({
            text: `${edu.institution} | ${edu.graduationDate}`
          })
        );
      }
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      sections.push(
        new Paragraph({
          text: 'TECHNICAL SKILLS',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: cvData.skills.join(' • ')
        })
      );
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Export CV as HTML format
   * @param {Object} cvData - Structured CV data
   * @param {string} templateName - Template name
   * @returns {string} HTML content
   */
  exportAsHtml(cvData, templateName = 'professional') {
    const template = this.templates.get(templateName) || this.templates.get('professional');
    const colors = template.colors;

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cvData.name || 'CV'}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px auto; 
            max-width: 800px; 
            color: ${colors.text}; 
        }
        .header { text-align: center; margin-bottom: 30px; }
        .name { font-size: 2.5em; font-weight: bold; color: ${colors.primary}; margin-bottom: 10px; }
        .contact { color: ${colors.secondary}; margin-bottom: 20px; }
        .section { margin: 30px 0; }
        .section-title { 
            font-size: 1.4em; 
            font-weight: bold; 
            color: ${colors.primary}; 
            border-bottom: 2px solid ${colors.primary}; 
            margin-bottom: 15px; 
        }
        .job-title { font-weight: bold; color: ${colors.text}; }
        .job-details { color: ${colors.secondary}; font-style: italic; margin-bottom: 10px; }
        .highlights { margin-left: 20px; }
        .highlight { margin: 5px 0; }
        .skills { line-height: 1.8; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>`;

    // Header
    if (cvData.name) {
      html += `<div class="header">
        <div class="name">${cvData.name}</div>`;

      let contactInfo = [];
      if (cvData.email) contactInfo.push(cvData.email);
      if (cvData.phone) contactInfo.push(cvData.phone);
      if (cvData.linkedin) contactInfo.push(`<a href="${cvData.linkedin}">${cvData.linkedin}</a>`);
      if (cvData.github) contactInfo.push(`<a href="${cvData.github}">${cvData.github}</a>`);

      if (contactInfo.length > 0) {
        html += `<div class="contact">${contactInfo.join(' | ')}</div>`;
      }
      html += '</div>';
    }

    // Summary
    if (cvData.summary) {
      html += `<div class="section">
        <div class="section-title">PROFESSIONAL SUMMARY</div>
        <p>${cvData.summary}</p>
      </div>`;
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      html += `<div class="section">
        <div class="section-title">PROFESSIONAL EXPERIENCE</div>`;

      for (const exp of cvData.experience) {
        html += `<div class="job-title">${exp.title} | ${exp.company}</div>
          <div class="job-details">${exp.startDate} - ${exp.endDate}${exp.location ? ' | ' + exp.location : ''}</div>`;

        if (exp.highlights && exp.highlights.length > 0) {
          html += '<div class="highlights">';
          for (const highlight of exp.highlights.slice(0, 5)) {
            html += `<div class="highlight">• ${highlight}</div>`;
          }
          html += '</div>';
        }
        html += '<br>';
      }
      html += '</div>';
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      html += `<div class="section">
        <div class="section-title">EDUCATION</div>`;

      for (const edu of cvData.education) {
        html += `<div class="job-title">${edu.degree} in ${edu.field}</div>
          <div class="job-details">${edu.institution} | ${edu.graduationDate}</div><br>`;
      }
      html += '</div>';
    }

    // Skills
    if (cvData.skills && cvData.skills.length > 0) {
      html += `<div class="section">
        <div class="section-title">TECHNICAL SKILLS</div>
        <div class="skills">${cvData.skills.join(' • ')}</div>
      </div>`;
    }

    html += '</body></html>';
    return html;
  }

  /**
   * Get available templates
   * @returns {Array} Available templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      id: key,
      name: template.name,
      description: template.description
    }));
  }

  /**
   * Get available export formats
   * @returns {Array} Available formats
   */
  getAvailableFormats() {
    return [
      { id: 'pdf', name: 'PDF', description: 'Portable Document Format - universally compatible' },
      { id: 'docx', name: 'DOCX', description: 'Microsoft Word Document - easily editable' },
      { id: 'html', name: 'HTML', description: 'Web format - great for online portfolios' }
    ];
  }
}

module.exports = new PDFExporter();