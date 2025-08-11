const fs = require('fs/promises');
const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';
const CV_PATH = 'cv.txt';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function matchJob(knex, job) {
  console.log(`🔍 CV-matching for: ${job.title}`);

  // Use the description already saved in the database
  const description = job.description;

  if (!description) {
    console.warn(`⚠️ No description found for job ${job.id}, cannot match.`);
    return { match: false, score: 0, reasons: ['missing-description'] };
  }

  const cvText = await fs.readFile(CV_PATH, 'utf8');

  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            "You are a precise CV analysis agent. Your task is to compare a candidate's CV against a job description and identify the key reasons for a match, based *only* on the information explicitly stated in the CV."
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

Assess the suitability of the candidate for the job based *strictly* on the provided CV. Do not infer or add skills not explicitly listed. Return ONLY valid JSON with the following keys:
- match: boolean (true if the CV is a strong match for the role)
- score: number between 0 and 1, representing the degree of match
- key_reasons: array of strings, where each string is a key reason for the match, quoting or summarizing a specific point *from the CV* that aligns with the job description.
`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ CV-match result: ${JSON.stringify(result)}`);

    const existingMatch = await knex('matches').where({ job_id: job.id }).first();

    let finalResult;
    if (existingMatch) {
      [finalResult] = await knex('matches').where({ id: existingMatch.id }).update({
        match: result.match,
        score: result.score,
        reasons: JSON.stringify(result.key_reasons || []),
        checked_at: new Date().toISOString()
      }).returning('*');
    } else {
      [finalResult] = await knex('matches').insert({
        job_id: job.id,
        match: result.match,
        score: result.score,
        reasons: JSON.stringify(result.key_reasons || []),
        checked_at: new Date().toISOString()
      }).returning('*');
    }

    return finalResult;
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

