const Groq = require('groq-sdk');
const { z } = require('zod');
const { jsonrepair } = require('jsonrepair');
const cvVersioning = require('./cvVersioning');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';

if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY in your .env');
const groq = new Groq({ apiKey: GROQ_API_KEY });

// -------------------- Schemas & utils

const LlmSchema = z.object({
  core_requirements: z.array(z.string()).max(40),
  matched_requirements: z.array(z.string()).max(40),
  matched_skills: z.array(z.string()).max(80),
  missing_skills: z.array(z.string()).max(80),
  key_insights: z.array(z.string()).max(20)
});

const TestsSchema = z.object({
  tests: z.array(z.string()).max(20)
});

const SAFE_OUTPUT = {
  match: false,
  score: 0,
  matched_skills: [],
  missing_skills: [],
  suggested_tests: [],
  completed_tests: [],
  key_insights: []
};

const MAX_PROMPT_CHARS = 24000;
const MATCH_THRESHOLD = 0.7;

const trimTo = (s, n) => (s || '').slice(0, n);
const clamp01 = n => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9+.#]/g, ' ').replace(/\s+/g, ' ').trim();

function tokens(s) {
  return new Set((s || '').toLowerCase().split(/[^a-z0-9+.#]+/).filter(w => w.length > 1));
}
function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size && !B.size) return 1;
  const inter = new Set([...A].filter(x => B.has(x)));
  const union = new Set([...A, ...B]);
  return inter.size / union.size;
}
function similar(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  return jaccard(na, nb) >= 0.6;
}

function safeParseWithSchema(raw, schema) {
  try {
    return { ok: true, data: schema.parse(JSON.parse(raw)) };
  } catch {
    try {
      const repaired = jsonrepair(String(raw || ''));
      return { ok: true, data: schema.parse(JSON.parse(repaired)) };
    } catch (e2) {
      return { ok: false, error: e2 };
    }
  }
}

// -------------------- LLM calls (JSON-only, low temp, retry)

async function callGroqJson(messages, schema, attempts = 3) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const chat = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages
      });
      const raw = chat?.choices?.[0]?.message?.content ?? '';
      const parsed = safeParseWithSchema(raw, schema);
      if (parsed.ok) return parsed.data;
      lastErr = parsed.error;
    } catch (e) {
      lastErr = e;
    }
    await sleep(300 * i + Math.floor(Math.random() * 200));
  }
  console.warn('⚠️ Using empty structure due to JSON issues:', lastErr?.message);
  // return shape matching the schema where possible
  if (schema === LlmSchema) {
    return {
      core_requirements: [],
      matched_requirements: [],
      matched_skills: [],
      missing_skills: [],
      key_insights: []
    };
  }
  if (schema === TestsSchema) return { tests: [] };
  return {};
}

// -------------------- Prompts (no hard-coded role hints)

function structureSystemPrompt() {
  return [
    'You extract structured facts only.',
    'Return JSON ONLY (no prose, no code fences).',
    'Use ONLY explicit CV content to claim matches. Do not infer.',
    'From the job description, list concise, deduplicated core requirements (max ~20).',
    'List which of those are clearly matched by the CV (use the requirement phrasing or a simplified equivalent).',
    'Also list matched_skills and missing_skills as short skill phrases (deduped).',
    'If unsure, leave arrays empty.'
  ].join(' ');
}

function structureUserPrompt(cv, jd, testsSummary) {
  return `
Candidate CV:
---
${cv}
---

Job Description:
---
${jd}
---

Completed tests (FYI only; do not guess or invent):
${testsSummary.length ? testsSummary.map(t=>`- ${t.skill}: ${t.score}% (${t.completed_at})`).join('\n') : 'No test results available'}

Return ONLY valid JSON with EXACTLY these keys:
{
  "core_requirements": string[],
  "matched_requirements": string[],
  "matched_skills": string[],
  "missing_skills": string[],
  "key_insights": string[]
}
`.trim();
}

function testsSystemPrompt() {
  return [
    'You convert missing skills into concise, test-like titles.',
    'Return JSON ONLY with key "tests": string[].',
    'STRICT CONSTRAINTS:',
    '- Every suggested test MUST be derived from the provided missing_skills or appear verbatim in the job description.',
    '- Do NOT introduce new topics or domains.',
    '- Keep titles short and atomic (e.g., "Next.js", "Accessibility (WCAG)", "GraphQL", "REST APIs").',
    '- Deduplicate.'
  ].join(' ');
}

function testsUserPrompt(missingSkills, jobDescription) {
  return `
Job Description (reference only):
---
${jobDescription}
---

Missing skills to convert to test-like titles:
${missingSkills.map(s => `- ${s}`).join('\n')}

Return ONLY:
{ "tests": string[] }
`.trim();
}

// -------------------- Main entry

async function matchJob(knex, job, userId) {
  console.log(`🔍 CV-matching for: ${job.title} (User: ${userId})`);

  const description = job?.description || '';
  if (!description) {
    console.warn(`⚠️ No description found for job ${job?.id}, cannot match.`);
    return { match: false, score: 0, reasons: ['missing-description'] };
  }

  const cvData = await cvVersioning.getCvForMatching(userId);
  const cvTextFull = cvData?.content || '';
  if (!cvTextFull) {
    console.warn(`⚠️ No CV content found in database for user ${userId}, cannot match.`);
    return { match: false, score: 0, reasons: ['missing-cv'] };
  }

  console.log(`🔍 Using CV version ${cvData.version} for matching`);

  // Load user tests (from existing table)
  const testData = await knex('test_sessions')
    .select('skill', 'score', 'completed_at')
    .where({ user_id: userId })
    .whereNotNull('score')
    .orderBy('completed_at', 'desc');

  const cvText = trimTo(cvTextFull, Math.floor(MAX_PROMPT_CHARS * 0.6));
  const jobText = trimTo(description, Math.floor(MAX_PROMPT_CHARS * 0.35));

  // 1) Get structure (requirements/matches/gaps)
  const llm = await callGroqJson(
    [
      { role: 'system', content: structureSystemPrompt() },
      { role: 'user', content: structureUserPrompt(cvText, jobText, testData) }
    ],
    LlmSchema,
    3
  );

  // 2) Deterministic scoring
  const total = Math.max(1, new Set(llm.core_requirements.map(norm)).size);
  const matched = new Set(llm.matched_requirements.map(norm)).size;
  const score = clamp01(matched / total);
  const match = score >= MATCH_THRESHOLD;

  // 3) Derive suggested_tests via constrained LLM pass, then locally filter
  let suggested = [];
  if ((llm.missing_skills || []).length) {
    const testGen = await callGroqJson(
      [
        { role: 'system', content: testsSystemPrompt() },
        { role: 'user', content: testsUserPrompt(llm.missing_skills, jobText) }
      ],
      TestsSchema,
      2
    );
    suggested = Array.from(new Set((testGen.tests || []).map(t => t.trim()).filter(Boolean)));
  }

  // Filter out anything not present in JD or missing_skills (hard constraint, but data-driven)
  const jdNorm = norm(jobText);
  const msNormList = (llm.missing_skills || []).map(norm);
  suggested = suggested.filter(s => {
    const ns = norm(s);
    return jdNorm.includes(ns) || msNormList.some(ms => ms.includes(ns) || ns.includes(ms));
  });

  // Exclude tests the user already PASSED (>60%); include failed ones (<=60%) for retake
  const passed = testData.filter(t => Number(t.score) > 60).map(t => t.skill);
  suggested = suggested.filter(sug => !passed.some(p => similar(p, sug)));

  // Keep it tidy
  suggested = suggested.slice(0, 8);

  // 4) Completed tests to persist (from existing DB, unchanged)
  const completed_tests = testData.map(t => ({
    skill: String(t.skill || ''),
    score: Number(t.score) || 0,
    date: String(t.completed_at || '')
  }));

  // 5) Prepare DB payload (same columns you already use)
  const matchData = {
    match,
    score,
    reasons: JSON.stringify(llm.matched_skills || []),
    missing_skills: JSON.stringify(llm.missing_skills || []),
    suggested_tests: JSON.stringify(suggested),
    completed_tests: JSON.stringify(completed_tests),
    key_insights: JSON.stringify(llm.key_insights || []),
    cv_version: cvData.version,
    cv_content_snapshot: cvTextFull.substring(0, 5000),
    checked_at: new Date().toISOString()
  };

  const existing = await knex('matches').where({ job_id: job.id }).first();
  let finalRow;
  if (existing) {
    const updated = await knex('matches')
      .where({ id: existing.id })
      .update(matchData)
      .returning('*');
    finalRow = Array.isArray(updated) ? updated[0] : { id: existing.id, ...matchData };
  } else {
    const inserted = await knex('matches')
      .insert({ job_id: job.id, user_id: userId, ...matchData })
      .returning('*');
    finalRow = Array.isArray(inserted) ? inserted[0] : matchData;
  }

  // 6) Return parsed fields in your existing shape
  return {
    ...finalRow,
    match,
    score,
    reasons: JSON.parse(finalRow.reasons || '[]'),
    missing_skills: JSON.parse(finalRow.missing_skills || '[]'),
    suggested_tests: JSON.parse(finalRow.suggested_tests || '[]'),
    completed_tests: JSON.parse(finalRow.completed_tests || '[]'),
    key_insights: JSON.parse(finalRow.key_insights || '[]')
  };
}

async function closeBrowser() { return; }

module.exports = { matchJob, closeBrowser };