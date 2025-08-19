const fs = require('fs').promises;
const path = require('path');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function seedProfileFromCv() {
  console.log('🌱 Reading cv.txt to seed master profile...');
  const cvPath = path.resolve(__dirname, '../../cv.txt');
  const cvText = await fs.readFile(cvPath, 'utf-8');

  const prompt = `
    You are an expert data extraction and structuring AI. Your task is to parse the following CV text and convert it into a structured JSON object.

    **THE TASK:**
    1.  **Read the CV Text:** Analyze the provided CV.
    2.  **Extract Key Information:** Identify all the distinct sections: summary, skills, work experience, projects, and education.
    3.  **Structure the Output:** Create a JSON object with the following keys: "profile", "skills", "work_experiences", "projects", "education".
    4.  **Follow the Schema:**
        *   **profile:** An object with keys: "full_name", "email", "phone", "linkedin_url", "github_url", "summary".
        *   **skills:** An array of objects, each with "name" and "category". Infer the category (e.g., Frontend, Backend, Database, Tooling) for each skill.
        *   **work_experiences:** An array of objects, each with "company", "title", "start_date", "end_date", "location", and an array of "highlights". Each highlight should be an object with a "highlight_text" key.
        *   **projects:** An array of objects, each with "name", "description", and an array of "highlights". Each highlight should be an object with a "highlight_text" key.
        *   **education:** An array of objects, each with "institution", "degree", "field_of_study", "graduation_date".

    **IMPORTANT:**
    *   The output MUST be a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON.
    *   Be precise. Extract the data as accurately as possible.

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
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error parsing CV with AI:", error);
    throw new Error("Failed to parse CV with AI.");
  }
}

module.exports = { seedProfileFromCv };
