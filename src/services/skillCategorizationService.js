const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Generate appropriate categories for skills based on user's profession and skills
 * @param {Array<string>} skillNames - Array of skill names to categorize
 * @param {string} userProfession - User's profession/industry context
 * @returns {Promise<Object>} Object mapping skill names to categories
 */
async function categorizeSkills(skillNames, userProfession) {
  try {
    const skillsList = skillNames.join('\n- ');
    
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor who categorizes professional skills into logical, industry-appropriate categories.

IMPORTANT GUIDELINES:
1. Create categories that make sense for the user's profession/industry
2. Use 2-4 words for category names (e.g., "Digital Marketing", "Clinical Care", "Financial Analysis")
3. Group related skills together under appropriate categories
4. Avoid technical programming categories unless the user is actually in tech
5. Make categories specific enough to be meaningful but broad enough to group multiple skills
6. Consider the user's career level and industry context

Examples of good categorization by profession:
- Marketing: "Digital Marketing", "Content Strategy", "Analytics & Insights", "Campaign Management", "Marketing Technology"
- Healthcare: "Clinical Care", "Medical Documentation", "Patient Safety", "Healthcare Technology", "Professional Development"  
- Finance: "Financial Analysis", "Risk Management", "Financial Technology", "Regulatory Compliance", "Client Relations"
- Education: "Curriculum Design", "Educational Technology", "Student Assessment", "Classroom Management", "Professional Development"
- Sales: "Sales Strategy", "Client Relations", "Sales Technology", "Market Analysis", "Business Development"

Return a JSON object where each skill name maps to its appropriate category.`
        },
        {
          role: 'user',  
          content: `Categorize these skills for a professional in: ${userProfession}

Skills to categorize:
- ${skillsList}

Return ONLY a JSON object mapping each skill to its appropriate category:
{"skill1": "Category1", "skill2": "Category2", etc}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const result = JSON.parse(chat.choices[0].message.content || '{}');
    
    // Validate that we got categories for all skills
    const categorizedSkills = {};
    skillNames.forEach(skill => {
      categorizedSkills[skill] = result[skill] || 'Professional Skills';
    });
    
    return categorizedSkills;

  } catch (error) {
    console.error('Error categorizing skills:', error);
    // Fallback to generic categorization
    const fallback = {};
    skillNames.forEach(skill => {
      fallback[skill] = 'Professional Skills';
    });
    return fallback;
  }
}

module.exports = {
  categorizeSkills
};