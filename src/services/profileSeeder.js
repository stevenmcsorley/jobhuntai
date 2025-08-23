const Groq = require('groq-sdk');
const knex = require('knex')(require('../../knexfile').development);
const skillCategorizationService = require('./skillCategorizationService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function seedProfileFromCv(userId) {
  console.log('🌱 Reading CV from database to seed master profile for user:', userId);
  
  // Get CV content from database for the specific user
  const cvRecord = await knex('cvs').where({ user_id: userId }).first();
  if (!cvRecord || !cvRecord.content) {
    throw new Error('No CV content found for user. Please save your CV first.');
  }
  
  const cvText = cvRecord.content;

  const prompt = `
    You are an expert data extraction and structuring AI. Your task is to parse the following CV text and convert it into a structured JSON object.

    **THE TASK:**
    1.  **Read the CV Text:** Analyze the provided CV.
    2.  **Extract Key Information:** Identify all sections including: summary, skills, work experience, projects, education, leadership, achievements, certifications, awards, etc.
    3.  **Structure the Output:** Create a JSON object with the following keys: "profile", "skills", "work_experiences", "projects", "education".
    4.  **Follow the Schema:**
        *   **profile:** An object with keys: "full_name", "email", "phone", "linkedin_url", "github_url", "summary".
        *   **skills:** An array of objects, each with "name" (the category will be determined separately based on the user's profession).
        *   **work_experiences:** An array of objects, each with "company", "title", "start_date", "end_date", "location", and an array of "highlights". Each highlight should be an object with a "highlight_text" key. IMPORTANT: If you find a separate LEADERSHIP, ACHIEVEMENTS, IMPACT, SELECTED PROJECTS, or similar sections, incorporate these details into the work experience highlights of the most relevant job position.
        *   **projects:** An array of objects, each with "name", "description", and an array of "highlights". Each highlight should be an object with a "highlight_text" key.
        *   **education:** An array of objects, each with "institution", "degree", "field_of_study", "graduation_date".

    **SPECIAL INSTRUCTIONS FOR NON-STANDARD SECTIONS:**
    * **LEADERSHIP Section:** Add leadership bullet points to the most relevant work experience highlights
    * **ACHIEVEMENTS/IMPACT Section:** Add achievement details to appropriate work experience highlights  
    * **SELECTED PROJECTS Section:** Add as separate projects AND relevant highlights to work experiences
    * **CERTIFICATIONS/AWARDS:** Include in the summary or add to relevant work experience highlights
    * **CORE SKILLS/TOOLS Section:** Extract all individual skills, tools, and technologies mentioned

    **IMPORTANT:**
    *   The output MUST be a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON.
    *   Be precise. Extract ALL data, especially leadership, achievements, and detailed metrics.
    *   Don't lose any quantified results or leadership experiences.

    **CV TEXT TO PARSE:**
    ---
    ${cvText}
    ---

    Now, generate the structured JSON object.
  `;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-70b-instant",
      messages: [
        {
          role: "system",
          content:
            "You extract structured JSON from unstructured CV text. Output must be strictly valid JSON with the required schema and no extra commentary.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    let jsonText = completion.choices?.[0]?.message?.content || "";

    // Clean the response to ensure it's valid JSON
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    console.log('✅ CV parsed successfully by AI.');
    const parsedData = JSON.parse(jsonText);
    
    // Use AI to categorize skills based on user's profession
    if (parsedData.skills && parsedData.skills.length > 0) {
      console.log('🔄 Categorizing skills with AI...');
      
      // Determine user's profession from work experience or summary
      let userProfession = 'Professional';
      if (parsedData.work_experiences && parsedData.work_experiences.length > 0) {
        const latestJob = parsedData.work_experiences[0];
        userProfession = `${latestJob.title} in ${latestJob.company}`;
      } else if (parsedData.profile && parsedData.profile.summary) {
        userProfession = parsedData.profile.summary.slice(0, 100); // First 100 chars of summary
      }
      
      // Extract skill names
      const skillNames = parsedData.skills.map(skill => skill.name);
      
      // Get AI-generated categories
      const skillCategories = await skillCategorizationService.categorizeSkills(skillNames, userProfession);
      
      // Update skills with appropriate categories
      parsedData.skills = parsedData.skills.map(skill => ({
        name: skill.name,
        category: skillCategories[skill.name] || 'Professional Skills'
      }));
      
      console.log('✅ Skills categorized successfully.');
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error parsing CV with AI:", error);
    throw new Error("Failed to parse CV with AI.");
  }
}

module.exports = { seedProfileFromCv };
