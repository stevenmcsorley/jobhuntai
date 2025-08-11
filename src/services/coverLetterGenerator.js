const Groq = require('groq-sdk');
const fs = require('fs').promises;
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function generateCoverLetter(job, profile) {
  console.log(`🤖 Generating cover letter for: ${job.title}`);
  try {
    // The user's full CV is now built from the master profile
    const cvText = `
      Name: ${profile.profile.full_name}
      Email: ${profile.profile.email}
      Phone: ${profile.profile.phone}
      LinkedIn: ${profile.profile.linkedin_url}
      GitHub: ${profile.profile.github_url}

      Summary:
      ${profile.profile.summary}

      Skills:
      ${profile.skills.map(s => s.skill_name).join(', ')}

      Work Experience:
      ${profile.work_experiences.map(exp => `
        ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})
        ${exp.highlights.map(h => `  - ${h.highlight_text}`).join('\n')}
      `).join('\n')}

      Projects:
      ${profile.projects.map(proj => `
        ${proj.project_name} (${proj.start_date} - ${proj.end_date || 'Present'})
        ${proj.highlights.map(h => `  - ${h.highlight_text}`).join('\n')}
      `).join('\n')}

      Education:
      ${profile.education.map(edu => `
        ${edu.degree} in ${edu.field_of_study} from ${edu.institution}
      `).join('\n')}
    `;

    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert career coach and professional writer. Your task is to write a compelling, concise, and professional cover letter. The user will provide their CV and a job description. You must tailor the cover letter to the specific job, highlighting the most relevant skills and experiences from the CV. The tone should be professional but enthusiastic. Do not invent any skills or experiences. The output should be only the text of the cover letter, with no extra commentary or formatting. The letter should be signed with the user's name: ${profile.profile.full_name}.`
        },
        {
          role: 'user',
          content: `
Here is my CV:
---
${cvText}
---

Here is the job I am applying for:
---
Job Title: ${job.title}
Company: ${job.company}
Job Description:
${job.description}
---

Please write a tailored cover letter for this role based on my CV.
`
        }
      ]
    });


    const coverLetterText = chat.choices[0].message.content || '';
    console.log(`✅ Cover letter generated for: ${job.title}`);
    return coverLetterText;

  } catch (err) {
    console.error(`❌ Groq error during cover letter generation: ${err.message}`);
    throw err;
  }
}

module.exports = { generateCoverLetter };
