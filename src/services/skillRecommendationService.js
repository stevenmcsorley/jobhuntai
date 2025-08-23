const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Generate AI-powered skill recommendations based on user profile
 * @param {Object} profileData - User's profile data including skills, experience, education
 * @returns {Promise<Array<string>>} Array of recommended skills to test
 */
async function generateSkillRecommendations(profileData) {
  try {
    // Extract relevant profile information
    const profileSummary = buildProfileSummary(profileData);
    
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert career development advisor. Based on a user's professional profile, recommend 5-8 specific, testable skills that would be valuable for their career growth and industry.

IMPORTANT GUIDELINES:
1. Recommend skills that are actually testable (avoid abstract concepts like "good attitude")
2. Focus on industry-relevant, in-demand skills for their profession
3. Consider both current role and potential career advancement
4. Include mix of technical skills, soft skills, and industry-specific knowledge
5. Avoid recommending skills they clearly already have strong experience with
6. Prioritize skills that have high market demand in their field
7. Consider emerging trends in their industry

Examples of good testable skills by industry:
- Marketing: Digital Marketing, SEO/SEM, Google Analytics, Content Strategy, Social Media Marketing, Email Marketing, Marketing Automation
- Healthcare: Medical Terminology, HIPAA Compliance, Electronic Health Records, Patient Care, Clinical Documentation, Pharmacology
- Education: Curriculum Development, Classroom Management, Educational Technology, Student Assessment, Learning Management Systems
- Finance: Financial Analysis, Excel Advanced, QuickBooks, Risk Management, Investment Analysis, Financial Modeling
- Technology: Programming languages, Cloud platforms, Database management, Cybersecurity, DevOps tools
- Legal: Legal Research, Contract Analysis, Regulatory Compliance, Case Management, Legal Writing
- Sales: CRM Systems, Sales Strategy, Negotiation, Lead Generation, Customer Relationship Management

Return ONLY valid JSON in this exact format: {"skills": ["skill1", "skill2", "skill3", "skill4", "skill5"]}`
        },
        {
          role: 'user',
          content: `Analyze this professional profile and recommend 5-8 testable skills for career growth:

${profileSummary}

Return ONLY valid JSON in this exact format: {"skills": ["skill1", "skill2", "skill3", "skill4", "skill5"]}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(chat.choices[0].message.content || '{"skills": []}');
    
    // Handle different possible response formats
    if (Array.isArray(result)) {
      return result.slice(0, 8); // Limit to 8 skills
    } else if (result.skills && Array.isArray(result.skills)) {
      return result.skills.slice(0, 8);
    } else if (result.recommendations && Array.isArray(result.recommendations)) {
      return result.recommendations.slice(0, 8);
    } else {
      // Fallback to general professional skills
      return ['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management'];
    }

  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    // Fallback to general professional skills on error
    return ['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management'];
  }
}

/**
 * Build a concise profile summary for AI analysis
 * @param {Object} profileData - User's profile data
 * @returns {string} Formatted profile summary
 */
function buildProfileSummary(profileData) {
  let summary = '';
  
  // Basic profile info
  if (profileData.profile) {
    if (profileData.profile.full_name) {
      summary += `Name: ${profileData.profile.full_name}\n`;
    }
    if (profileData.profile.summary) {
      summary += `Professional Summary: ${profileData.profile.summary}\n\n`;
    }
  }
  
  // Current skills
  if (profileData.skills && profileData.skills.length > 0) {
    summary += `Current Skills:\n`;
    profileData.skills.slice(0, 10).forEach(skill => {
      summary += `- ${skill.name || skill.skill_name || 'Unknown'}\n`;
    });
    summary += '\n';
  }
  
  // Work experience (most recent 3 positions)
  if (profileData.work_experiences && profileData.work_experiences.length > 0) {
    summary += `Recent Work Experience:\n`;
    profileData.work_experiences.slice(0, 3).forEach(exp => {
      summary += `- ${exp.title} at ${exp.company} (${exp.start_date}-${exp.end_date || 'Present'})\n`;
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.slice(0, 2).forEach(highlight => {
          summary += `  • ${highlight.highlight_text}\n`;
        });
      }
    });
    summary += '\n';
  }
  
  // Education
  if (profileData.education && profileData.education.length > 0) {
    summary += `Education:\n`;
    profileData.education.slice(0, 2).forEach(edu => {
      summary += `- ${edu.degree} ${edu.field_of_study ? 'in ' + edu.field_of_study : ''} from ${edu.institution} (${edu.graduation_date})\n`;
    });
    summary += '\n';
  }
  
  // Projects (if any)
  if (profileData.projects && profileData.projects.length > 0) {
    summary += `Notable Projects:\n`;
    profileData.projects.slice(0, 3).forEach(proj => {
      summary += `- ${proj.project_name}: ${proj.role}\n`;
    });
  }
  
  return summary.trim();
}

module.exports = {
  generateSkillRecommendations
};