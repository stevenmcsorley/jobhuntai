const express = require('express');
const router = express.Router();
const knex = require('knex')(require('../../../knexfile').development);
const { authenticateToken } = require('../../middleware/auth');

// Use authentication middleware for all profile routes
router.use(authenticateToken);

// --- Helper to fetch full profile ---
const getFullProfile = async (userId) => {
  const profile = await knex('profiles').where({ user_id: userId }).first();
  const skills = await knex('skills').where({ user_id: userId }).select('*');
  const work_experiences = await knex('work_experiences').where({ user_id: userId }).select('*');
  const experience_highlights = await knex('experience_highlights').select('*');
  const projects = await knex('projects').where({ user_id: userId }).select('*');
  const project_highlights = await knex('project_highlights').select('*');
  const education = await knex('education').where({ user_id: userId }).select('*');

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
    const fullProfile = await getFullProfile(req.user.id);
    res.json(fullProfile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile data.', details: err.message });
  }
});

// POST /api/profile/seed - Parse cv.txt and populate the profile tables
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Starting profile seed for user:', req.user.id);
    const structuredProfile = await seedProfileFromCv(req.user.id);
    console.log('✅ CV parsed, structured profile:', JSON.stringify(structuredProfile, null, 2));

    // Use a transaction to ensure the entire operation succeeds or fails together
    await knex.transaction(async trx => {
      console.log('🗑️ Clearing existing profile data for user:', req.user.id);
      
      // Clear all existing profile data for this user
      await trx('education').where({ user_id: req.user.id }).del();
      await trx('project_highlights').whereIn('project_id', trx('projects').where({ user_id: req.user.id }).select('id')).del();
      await trx('projects').where({ user_id: req.user.id }).del();
      await trx('experience_highlights').whereIn('experience_id', trx('work_experiences').where({ user_id: req.user.id }).select('id')).del();
      await trx('work_experiences').where({ user_id: req.user.id }).del();
      await trx('skills').where({ user_id: req.user.id }).del();
      await trx('profiles').where({ user_id: req.user.id }).del();

      console.log('📝 Inserting new profile data...');
      // Insert new data with user_id
      const { profile, skills, work_experiences, projects, education } = structuredProfile;
      
      if (profile) {
        console.log('Inserting profile:', profile);
        await trx('profiles').insert({ ...profile, user_id: req.user.id });
      }
      if (skills && skills.length > 0) {
        console.log('Inserting skills:', skills);
        const skillsWithUserId = skills.map(skill => ({ ...skill, user_id: req.user.id }));
        await trx('skills').insert(skillsWithUserId);
      }
      if (education && education.length > 0) {
        console.log('Inserting education:', education);
        const educationWithUserId = education.map(edu => ({ ...edu, user_id: req.user.id }));
        await trx('education').insert(educationWithUserId);
      }

      if (work_experiences && work_experiences.length > 0) {
        console.log('Inserting work experiences:', work_experiences);
        for (const exp of work_experiences) {
          const { highlights, ...expData } = exp;
          console.log('Inserting work experience:', expData);
          const [newExp] = await trx('work_experiences').insert({ ...expData, user_id: req.user.id }).returning('*');
          if (highlights && highlights.length > 0) {
            console.log('Inserting experience highlights for exp ID:', newExp.id);
            const highlightsToInsert = highlights.map(h => ({
              experience_id: newExp.id,
              highlight_text: h.highlight_text
            }));
            await trx('experience_highlights').insert(highlightsToInsert);
          }
        }
      }

      if (projects && projects.length > 0) {
        console.log('Inserting projects:', projects);
        for (const proj of projects) {
          const { highlights, ...projData } = proj;
          console.log('Inserting project:', projData);
          const [newProj] = await trx('projects').insert({ ...projData, user_id: req.user.id }).returning('*');
          if (highlights && highlights.length > 0) {
            console.log('Inserting project highlights for project ID:', newProj.id);
            const highlightsToInsert = highlights.map(h => ({
              project_id: newProj.id,
              highlight_text: h.highlight_text
            }));
            await trx('project_highlights').insert(highlightsToInsert);
          }
        }
      }
      
      console.log('✅ All profile data inserted successfully');
    });

    console.log('🎉 Profile seeded successfully for user:', req.user.id);
    res.status(201).json({ message: 'Profile seeded successfully!' });

  } catch (err) {
    console.error('❌ Error seeding profile:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to seed profile from CV.', details: err.message });
  }
});

// POST /api/profile - Create or update the main profile
router.post('/', async (req, res) => {
  try {
    const { id, ...profileData } = req.body;
    const existingProfile = await knex('profiles').where({ user_id: req.user.id }).first();
    if (existingProfile) {
      await knex('profiles').where({ id: existingProfile.id, user_id: req.user.id }).update(profileData);
    } else {
      await knex('profiles').insert({ ...profileData, user_id: req.user.id });
    }
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile.', details: err.message });
  }
});

// --- Skills Routes ---
router.post('/skills', async (req, res) => {
  try {
    await knex('skills').insert({ ...req.body, user_id: req.user.id });
    res.status(201).json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add skill.', details: err.message });
  }
});

router.delete('/skills/:id', async (req, res) => {
  try {
    await knex('skills').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete skill.', details: err.message });
  }
});

// --- Work Experience Routes ---
router.post('/work-experiences', async (req, res) => {
  try {
    const { highlights, ...expData } = req.body;
    await knex.transaction(async trx => {
      const [newExp] = await trx('work_experiences').insert({ ...expData, user_id: req.user.id }).returning('*');
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          experience_id: newExp.id,
          highlight_text: h.highlight_text
        }));
        await trx('experience_highlights').insert(highlightsToInsert);
      }
    });
    res.status(201).json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add work experience.', details: err.message });
  }
});

router.put('/work-experiences/:id', async (req, res) => {
  try {
    const { highlights, ...expData } = req.body;
    await knex.transaction(async trx => {
      await trx('work_experiences').where({ id: req.params.id, user_id: req.user.id }).update(expData);
      await trx('experience_highlights').where({ experience_id: req.params.id }).del();
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          experience_id: req.params.id,
          highlight_text: h.highlight_text
        }));
        await trx('experience_highlights').insert(highlightsToInsert);
      }
    });
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update work experience.', details: err.message });
  }
});

router.delete('/work-experiences/:id', async (req, res) => {
  try {
    await knex('work_experiences').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete work experience.', details: err.message });
  }
});

// --- Project Routes ---
router.post('/projects', async (req, res) => {
  try {
    const { highlights, ...projectData } = req.body;
    await knex.transaction(async trx => {
      const [newProject] = await trx('projects').insert({ ...projectData, user_id: req.user.id }).returning('*');
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          project_id: newProject.id,
          highlight_text: h.highlight_text
        }));
        await trx('project_highlights').insert(highlightsToInsert);
      }
    });
    res.status(201).json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add project.', details: err.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const { highlights, ...projectData } = req.body;
    await knex.transaction(async trx => {
      await trx('projects').where({ id: req.params.id, user_id: req.user.id }).update(projectData);
      await trx('project_highlights').where({ project_id: req.params.id }).del();
      if (highlights && highlights.length > 0) {
        const highlightsToInsert = highlights.map(h => ({
          project_id: req.params.id,
          highlight_text: h.highlight_text
        }));
        await trx('project_highlights').insert(highlightsToInsert);
      }
    });
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.', details: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await knex('projects').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.', details: err.message });
  }
});

// --- Education Routes ---
router.post('/education', async (req, res) => {
  try {
    await knex('education').insert({ ...req.body, user_id: req.user.id });
    res.status(201).json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add education entry.', details: err.message });
  }
});

router.put('/education/:id', async (req, res) => {
  try {
    await knex('education').where({ id: req.params.id, user_id: req.user.id }).update(req.body);
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update education entry.', details: err.message });
  }
});

router.delete('/education/:id', async (req, res) => {
  try {
    await knex('education').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json(await getFullProfile(req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete education entry.', details: err.message });
  }
});

// GET /api/profile/download - Download the master profile as a text file
router.get('/download', async (req, res) => {
  try {
    const { profile, skills, work_experiences, projects, education } = await getFullProfile(req.user.id);

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
