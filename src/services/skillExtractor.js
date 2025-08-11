const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-70b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function extractSkills(description) {
  console.log('🤖 Extracting skills from job description...');
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert at parsing job descriptions. Your task is to extract all technical skills mentioned in the provided text.
          Return ONLY valid JSON with a single key: "skills", which is an array of strings. Each string should be a single skill.
          Do not include soft skills. Focus only on technologies, frameworks, languages, and tools.`
        },
        {
          role: 'user',
          content: `Job Description:\n---\n${description}\n---`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ Skills extracted: ${result.skills.length}`);
    return result.skills || [];
  } catch (err) {
    console.error(`❌ Groq error during skill extraction: ${err.message}`);
    throw err;
  n}
}

module.exports = { extractSkills };
