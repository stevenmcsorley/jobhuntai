const fs = require('fs/promises');
const Groq = require('groq-sdk');
const cvVersioning = require('./cvVersioning');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';
const CV_PATH = 'cv.txt';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function matchJob(knex, job, userId) {
  console.log(`🔍 CV-matching for: ${job.title} (User: ${userId})`);

  // Use the description already saved in the database
  const description = job.description;

  if (!description) {
    console.warn(`⚠️ No description found for job ${job.id}, cannot match.`);
    return { match: false, score: 0, reasons: ['missing-description'] };
  }

  // Get current CV version for matching
  const cvData = await cvVersioning.getCvForMatching(userId);
  const cvText = cvData.content;

  if (!cvText) {
    console.warn(`⚠️ No CV content found in database for user ${userId}, cannot match.`);
    return { match: false, score: 0, reasons: ['missing-cv'] };
  }

  console.log(`🔍 Using CV version ${cvData.version} for matching`);

  // Get test data to integrate with matching for specific user
  const testData = await knex('test_sessions')
    .select('skill', 'score', 'completed_at')
    .where({ user_id: userId })
    .whereNotNull('score') // Include all completed tests (passed and failed)
    .orderBy('completed_at', 'desc');

  const skillsWithTests = testData.map(t => ({
    skill: t.skill.toLowerCase(),
    score: t.score,
    completed_at: t.completed_at
  }));

  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert CV analysis agent. Analyze the candidate's CV against the job description with complete accuracy. Base your assessment ONLY on what is explicitly stated in the CV - do not infer, assume, or suggest skills not mentioned.

STRICT RULES:
1. ONLY include skills/experience that are explicitly mentioned in the CV text
2. Do NOT assume or infer related skills (e.g., if CV mentions "API integration" do NOT assume "GraphQL" experience)
3. Do NOT make creative leaps in key insights - stick to factual CV content
4. Be precise about what is actually stated vs what is missing
5. For test handling: Only exclude skills from suggested_tests if user scored >60% (passing)

IMPORTANT: For suggested_tests, recommend skills that are:
- Missing from the CV but required by the job
- Actually testable (focus on practical skills like Digital Marketing, SEO, Content Strategy, Data Analysis, Project Management)
- Relevant to the candidate's industry/role
- Industry-appropriate (avoid suggesting programming tests for non-technical roles)`
        },
        {
          role: 'user',
          content: `
Candidate CV:
---
${cvText}
---

Job Description:
---
${description}
---

Test Results Available:
${skillsWithTests.length > 0 ? skillsWithTests.map(s => `- ${s.skill}: ${s.score}% (completed ${s.completed_at})`).join('\n') : 'No test results available'}

Analyze this CV against the job requirements. Return ONLY valid JSON with these keys:

- match: boolean (true if 70%+ of core requirements are met)
- score: number 0-1 (percentage of requirements matched from CV)
- matched_skills: array of strings (skills/experience from CV that match job requirements - quote specific evidence)
- missing_skills: array of strings (required skills mentioned in job but not found in CV)
- suggested_tests: array of strings (skills from missing_skills that could be tested in test hub - exclude skills with test scores >60%, include skills with test scores ≤60% as they need retaking. Focus on industry-appropriate tests: for marketing roles suggest Digital Marketing, SEO, Content Strategy, Analytics; for healthcare suggest Medical Terminology, Patient Care; for education suggest Curriculum Development, etc. Avoid suggesting programming tests for non-technical roles)
- completed_tests: array of objects with {skill, score, date} for relevant completed tests from the Test Results Available section ONLY (do not include CV certifications or qualifications as completed tests - only include actual test hub results with scores and dates)
- key_insights: array of strings (specific observations about fit based on CV content)

Be extremely precise - only include skills actually mentioned in the CV, not inferred ones.`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ CV-match result: ${JSON.stringify(result)}`);

    // Prepare enhanced match data with CV version info
    const matchData = {
      match: result.match || false,
      score: result.score || 0,
      reasons: JSON.stringify(result.matched_skills || []),
      missing_skills: JSON.stringify(result.missing_skills || []),
      suggested_tests: JSON.stringify(result.suggested_tests || []),
      completed_tests: JSON.stringify(result.completed_tests || []),
      key_insights: JSON.stringify(result.key_insights || []),
      cv_version: cvData.version,
      cv_content_snapshot: cvText.substring(0, 5000), // Store first 5000 chars for audit
      checked_at: new Date().toISOString()
    };

    const existingMatch = await knex('matches').where({ job_id: job.id }).first();

    let finalResult;
    if (existingMatch) {
      [finalResult] = await knex('matches').where({ id: existingMatch.id }).update(matchData).returning('*');
    } else {
      [finalResult] = await knex('matches').insert({
        job_id: job.id,
        user_id: userId,
        ...matchData
      }).returning('*');
    }

    return {
      ...finalResult,
      // Parse JSON fields for easier consumption
      reasons: JSON.parse(finalResult.reasons || '[]'),
      missing_skills: JSON.parse(finalResult.missing_skills || '[]'),
      suggested_tests: JSON.parse(finalResult.suggested_tests || '[]'),
      completed_tests: JSON.parse(finalResult.completed_tests || '[]'),
      key_insights: JSON.parse(finalResult.key_insights || '[]')
    };
  } catch (err) {
    console.error(`❌ Groq error: ${err.message}`);
    return { match: false, score: 0, reasons: ['match-error'] };
  }
}

async function closeBrowser() {
    // No-op, browser is no longer used in this service
    return;
}

module.exports = { matchJob, closeBrowser };

