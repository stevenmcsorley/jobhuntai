const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function formatProfileForPrompt(profile) {
  let text = ``;
  if (profile.profile) {
    text += `Name: ${profile.profile.full_name}\nEmail: ${profile.profile.email}\nPhone: ${profile.profile.phone}\nLinkedIn: ${profile.profile.linkedin_url}\nGitHub: ${profile.profile.github_url}\n\nSummary: ${profile.profile.summary}\n\n`;
  }
  if (profile.skills && profile.skills.length > 0) {
    const grouped = profile.skills.reduce((acc, s) => {
      (acc[s.category] = acc[s.category] || []).push(s.name);
      return acc;
    }, {});
    text += `SKILLS:\n` + Object.entries(grouped).map(([cat, skills]) => `${cat}: ${skills.join(', ')}`).join('\n') + '\n\n';
  }
  if (profile.work_experiences && profile.work_experiences.length > 0) {
    text += `WORK EXPERIENCE:\n` + profile.work_experiences.map(e => 
      `Title: ${e.title}\nCompany: ${e.company}\nDates: ${e.start_date} - ${e.end_date}\n` + 
      e.highlights.map(h => `- ${h.highlight_text}`).join('\n')
    ).join('\n\n') + '\n\n';
  }
  if (profile.projects && profile.projects.length > 0) {
    text += `PROJECTS:\n` + profile.projects.map(p => 
      `Name: ${p.name}\nDescription: ${p.description}\n` +
      p.highlights.map(h => `- ${h.highlight_text}`).join('\n')
    ).join('\n\n') + '\n\n';
  }
  if (profile.education && profile.education.length > 0) {
     text += `EDUCATION:\n` + profile.education.map(e => `${e.institution} - ${e.degree}, ${e.field_of_study} (${e.graduation_date})`).join('\n');
  }
  return text;
}


async function tailorCv(job, profile) {
  console.log(`🤖 Starting AI-powered CV tailoring for "${job.title}"...`);

  const masterCV = formatProfileForPrompt(profile);

  const prompt = `
    You are an expert technical recruiter and professional resume writer. Your task is to create a tailored CV for a software developer based on their master profile and a specific job description.

    **THE TASK:**
    1.  **Analyze the Job Description:** Read the provided job description carefully. Identify the top 5-7 most important skills, technologies, and experience requirements.
    2.  **Analyze the Master CV:** Review the candidate's master CV, which contains all their skills, experiences, and project highlights.
    3.  **Construct the Tailored CV:** Create a new, tailored CV in plain text format. It MUST follow these rules:
        *   **Summary:** Rewrite the professional summary to directly address the key requirements of the job.
        *   **Skills:** Reorder the skills categories and the skills within them to prioritize those mentioned in the job description.
        *   **Work Experience & Projects:** For each role and project, select ONLY the most relevant 3-5 highlights (bullet points) that best match the job description. Do NOT include every highlight. Be selective.
        *   **Formatting:** Use clean, simple text formatting with clear headings (e.g., "--- Summary ---").

    **JOB DESCRIPTION:**
    ---
    ${job.description}
    ---

    **CANDIDATE'S MASTER CV:**
    ---
    ${masterCV}
    ---

    Now, generate the tailored CV based on these instructions.
  `;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical recruiter and professional resume writer. Produce clear, concise, ATS-friendly plain text CVs.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2200,
    });

    const tailoredCvText =
      completion.choices?.[0]?.message?.content?.trim() || "";

    if (!tailoredCvText) {
      throw new Error("Empty response from Groq");
    }

    console.log(`✅ AI tailoring complete for "${job.title}".`);
    return tailoredCvText;
  } catch (error) {
    console.error("Error during AI CV tailoring:", error);
    throw new Error("Failed to generate tailored CV from AI.");
  }
}

module.exports = { tailorCv };
