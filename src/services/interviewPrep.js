const Groq = require('groq-sdk');
const knex = require('knex')(require('../../knexfile').development);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function generateInterviewPrep(job) {
  console.log(`🤖 Generating interview prep for: ${job.title}`);
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach. Given a job description and company, generate insightful interview questions and key points about the company.'
        },
        {
          role: 'user',
          content: `
Job Title: ${job.title}
Company: ${job.company}
Job Description:
${job.description}

Please generate:
1.  Five likely technical interview questions based on this specific role.
2.  Three behavioral questions.
3.  A brief overview of the company and three potential talking points or questions I could ask them.

Return ONLY valid JSON with the following keys:
- "technical_questions": ["question1", ...]
- "behavioral_questions": ["question1", ...]
- "company_overview": "A brief summary..."
- "talking_points": ["point1", ...]
`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const prepData = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ Interview prep generated for: ${job.title}`);

    // Ensure an application record exists before updating it
    const existingApplication = await knex('applications').where({ job_id: job.id }).first();
    if (existingApplication) {
      await knex('applications')
        .where({ id: existingApplication.id })
        .update({
          meta: knex.raw('json_set(meta, "$.interview_prep", ?)', [JSON.stringify(prepData)])
        });
    } else {
      await knex('applications').insert({
        job_id: job.id,
        status: 'followup', // Default status when creating from prep
        meta: JSON.stringify({ interview_prep: prepData })
      });
    }

    return prepData;
  } catch (err) {
    console.error(`❌ Groq error during interview prep generation: ${err.message}`);
    throw err;
  }
}

module.exports = { generateInterviewPrep };
