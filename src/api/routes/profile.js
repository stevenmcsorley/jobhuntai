const express = require('express');
const router = express.Router();
const knex = require('knex')(require('../../../knexfile').development);

// --- Helper to fetch full profile ---
const getFullProfile = async () => {
  const profile = await knex('profiles').first();
  const skills = await knex('skills').select('*');
  const work_experiences = await knex('work_experiences').select('*');
  const experience_highlights = await knex('experience_highlights').select('*');
  const projects = await knex('projects').select('*');
  const project_highlights = await knex('project_highlights').select('*');
  const education = await knex('education').select('*');

  const experiencesWithHighlights = work_experiences.map(exp => ({
    ...exp,
    highlights: experience_highlights.filter(h => h.experience_id === exp.id)
  }));

  const projectsWithHighlights = projects.map(proj => ({
    ...proj,
    highlights: project_highlights.filter(h => h.project_id === proj.id)
  }));

  return {
    profile: profile || {},
    skills: skills || [],
    work_experiences: experiencesWithHighlights || [],
    projects: projectsWithHighlights || [],
    education: education || []
  };
};

const { seedProfileFromCv } = require('../../services/profileSeeder');

// GET /api/profile - Fetch all master profile data
router.get('/', async (req, res) => {
  try {
    const fullProfile = await getFullProfile();
    res.json(fullProfile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile data.', details: err.message });
  }
});

// POST /api/profile/seed - Parse cv.txt and populate the profile tables
router.post('/seed', async (req, res) => {
  try {
    const structuredProfile = await seedProfileFromCv();

    // Use a transaction to ensure the entire operation succeeds or fails together
    await knex.transaction(async trx => {
      // Clear all existing profile data
      await trx('education').del();
      await trx('project_highlights').del();
      await trx('projects').del();
      await trx('experience_highlights').del();
      await trx('work_experiences').del();
      await trx('skills').del();
      await trx('profiles').del();

      // Insert new data
      const { profile, skills, work_experiences, projects, education } = structuredProfile;
      
      if (profile) {
        await trx('profiles').insert(profile);
      }
      if (skills && skills.length > 0) {
        await trx('skills').insert(skills);
      }
      if (education && education.length > 0) {
        await trx('education').insert(education);
      }

      if (work_experiences && work_experiences.length > 0) {
        for (const exp of work_experiences) {
          const { highlights, ...expData } = exp;
          const [newExp] = await trx('work_experiences').insert(expData).returning('*');
          if (highlights && highlights.length > 0) {
            const highlightsToInsert = highlights.map(h => ({
              experience_id: newExp.id,
              highlight_text: h.highlight_text
            }));
            await trx('experience_highlights').insert(highlightsToInsert);
          }
        }
      }

      if (projects && projects.length > 0) {
        for (const proj of projects) {
          const { highlights, ...projData } = proj;
          const [newProj] = await trx('projects').insert(projData).returning('*');
          if (highlights && highlights.length > 0) {
            const highlightsToInsert = highlights.map(h => ({
              project_id: newProj.id,
              highlight_text: h.highlight_text
            }));
            await trx('project_highlights').insert(highlightsToInsert);
          }
        }
      }
    });

    res.status(201).json({ message: 'Profile seeded successfully!' });

  } catch (err) {
    res.status(500).json({ error: 'Failed to seed profile from CV.', details: err.message });
  }
});

// POST /api/profile - Create or update the main profile
router.post('/', async (req, res) => {
  try {
    const { id, ...profileData } = req.body;
    const existingProfile = await knex('profiles').first();
    if (existingProfile) {
      await knex('profiles').where({ id: existingProfile.id }).update(profileData);
    } else {
      await knex('profiles').insert(profileData);
    }
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile.', details: err.message });
  }
});

// --- Skills Routes ---
router.post('/skills', async (req, res) => {
  try {
    await knex('skills').insert(req.body);
    res.status(201).json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to add skill.', details: err.message });
  }
});

router.delete('/skills/:id', async (req, res) => {
  try {
    await knex('skills').where({ id: req.params.id }).del();
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete skill.', details: err.message });
  }
});

// --- Work Experience Routes ---
router.post('/work-experiences', async (req, res) => {
  try {
    const { highlights, ...expData } = req.body;
    await knex.transaction(async trx => {
      const [newExp] = await trx('work_experiences').insert(expData).returning('*');
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          experience_id: newExp.id,
          highlight_text: h.highlight_text
        }));
        await trx('experience_highlights').insert(highlightsToInsert);
      }
    });
    res.status(201).json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to add work experience.', details: err.message });
  }
});

router.put('/work-experiences/:id', async (req, res) => {
  try {
    const { highlights, ...expData } = req.body;
    await knex.transaction(async trx => {
      await trx('work_experiences').where({ id: req.params.id }).update(expData);
      await trx('experience_highlights').where({ experience_id: req.params.id }).del();
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          experience_id: req.params.id,
          highlight_text: h.highlight_text
        }));
        await trx('experience_highlights').insert(highlightsToInsert);
      }
    });
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update work experience.', details: err.message });
  }
});

router.delete('/work-experiences/:id', async (req, res) => {
  try {
    await knex('work_experiences').where({ id: req.params.id }).del();
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete work experience.', details: err.message });
  }
});

// --- Project Routes ---
router.post('/projects', async (req, res) => {
  try {
    const { highlights, ...projectData } = req.body;
    await knex.transaction(async trx => {
      const [newProject] = await trx('projects').insert(projectData).returning('*');
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          project_id: newProject.id,
          highlight_text: h.highlight_text
        }));
        await trx('project_highlights').insert(highlightsToInsert);
      }
    });
    res.status(201).json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to add project.', details: err.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const { highlights, ...projectData } = req.body;
    await knex.transaction(async trx => {
      await trx('projects').where({ id: req.params.id }).update(projectData);
      await trx('project_highlights').where({ project_id: req.params.id }).del();
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          project_id: req.params.id,
          highlight_text: h.highlight_text
        }));
        await trx('project_highlights').insert(highlightsToInsert);
      }
    });
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.', details: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await knex('projects').where({ id: req.params.id }).del();
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.', details: err.message });
  }
});

// --- Education Routes ---
router.post('/education', async (req, res) => {
  try {
    await knex('education').insert(req.body);
    res.status(201).json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to add education entry.', details: err.message });
  }
});

router.put('/education/:id', async (req, res) => {
  try {
    await knex('education').where({ id: req.params.id }).update(req.body);
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update education entry.', details: err.message });
  }
});

router.delete('/education/:id', async (req, res) => {
  try {
    await knex('education').where({ id: req.params.id }).del();
    res.json(await getFullProfile());
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete education entry.', details: err.message });
  }
});

// GET /api/profile/download - Download the master profile as a text file
router.get('/download', async (req, res) => {
  try {
    const { profile, skills, work_experiences, projects, education } = await getFullProfile();

    let content = `--- MASTER PROFILE ---

`;

    // Basic Profile Info
    content += `Name: ${profile.full_name || ''}
`;
    content += `Email: ${profile.email || ''}
`;
    content += `Phone: ${profile.phone || ''}
`;
    content += `LinkedIn: ${profile.linkedin_url || ''}
`;
    content += `GitHub: ${profile.github_url || ''}
`;
    content += `
--- SUMMARY ---
${profile.summary || ''}
`;

    // Skills
    content += `
--- SKILLS ---
`;
    content += skills.map(s => s.skill_name).join(', ') + '\n';;

    // Work Experience
    content += `
--- WORK EXPERIENCE ---
`;
    work_experiences.forEach(exp => {
      content += `
${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})
`;
      content += `Location: ${exp.location}
`;
      exp.highlights.forEach(h => {
        content += `  - ${h.highlight_text}
`;
      });
    });

    // Projects
    content += `
--- PROJECTS ---
`;
    projects.forEach(proj => {
      content += `
${proj.project_name} (${proj.start_date} - ${proj.end_date || 'Present'})
`;
      content += `Role: ${proj.role}
`;
      proj.highlights.forEach(h => {
        content += `  - ${h.highlight_text}
`;
      });
    });

    // Education
    content += `
--- EDUCATION ---
`;
    education.forEach(edu => {
      content += `
${edu.degree} in ${edu.field_of_study} from ${edu.institution}
`;
      content += `Graduation Date: ${edu.graduation_date}
`;
    });

    res.setHeader('Content-disposition', 'attachment; filename=master_profile.txt');
    res.setHeader('Content-type', 'text/plain');
    res.send(content);

  } catch (err) {
    res.status(500).json({ error: 'Failed to download profile.', details: err.message });
  }
});


module.exports = router;
module.exports.getFullProfile = getFullProfile;
