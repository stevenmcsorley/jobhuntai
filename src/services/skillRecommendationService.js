const Groq = require('groq-sdk');
const knex = require('knex')(require('../../knexfile').development);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';
const CACHE_DURATION_DAYS = 7; // Recommendations expire after 7 days

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Get skill recommendations for a user (cached or generate new)
 * @param {number} userId - User ID
 * @param {Object} profileData - User's profile data including skills, experience, education
 * @param {boolean} forceRefresh - Force regeneration even if cache exists
 * @returns {Promise<Array<string>>} Array of recommended skills to test
 */
async function generateSkillRecommendations(profileData, userId = null, forceRefresh = false) {
  try {
    // If userId is provided, check for cached recommendations first
    if (userId && !forceRefresh) {
      const cached = await getCachedRecommendations(userId);
      if (cached) {
        console.log('🎯 Using cached skill recommendations');
        return cached;
      }
    }

    // Generate new recommendations
    console.log('🤖 Generating new skill recommendations...');
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
    
    let recommendations = [];
    
    // Handle different possible response formats
    if (Array.isArray(result)) {
      recommendations = result.slice(0, 8); // Limit to 8 skills
    } else if (result.skills && Array.isArray(result.skills)) {
      recommendations = result.skills.slice(0, 8);
    } else if (result.recommendations && Array.isArray(result.recommendations)) {
      recommendations = result.recommendations.slice(0, 8);
    } else {
      // Fallback to personalized professional skills based on profile
      recommendations = getPersonalizedFallbackSkills(profileData);
    }

    // Save to database if userId provided
    if (userId && recommendations.length > 0) {
      await saveCachedRecommendations(userId, recommendations, profileSummary);
      console.log('✅ Skill recommendations saved to database');
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating skill recommendations:', error);
    
    // Try to get cached recommendations as fallback
    if (userId) {
      const cached = await getCachedRecommendations(userId, true); // Get even expired cache
      if (cached) {
        console.log('⚠️ Using expired cached recommendations due to error');
        return cached;
      }
    }
    
    // Final fallback
    return getPersonalizedFallbackSkills(profileData);
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

/**
 * Get cached skill recommendations from database
 * @param {number} userId - User ID
 * @param {boolean} includeExpired - Include expired recommendations
 * @returns {Promise<Array<string>|null>} Cached recommendations or null
 */
async function getCachedRecommendations(userId, includeExpired = false) {
  try {
    const query = knex('skill_recommendations')
      .where({ user_id: userId, is_active: true })
      .orderBy('generated_at', 'desc')
      .first();
    
    if (!includeExpired) {
      query.where('expires_at', '>', new Date());
    }
    
    const cached = await query;
    
    if (cached && cached.recommendations) {
      const recommendations = JSON.parse(cached.recommendations);
      return Array.isArray(recommendations) ? recommendations : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching cached recommendations:', error);
    return null;
  }
}

/**
 * Save skill recommendations to database cache
 * @param {number} userId - User ID
 * @param {Array<string>} recommendations - Skill recommendations
 * @param {string} profileSummary - Profile summary used for generation
 */
async function saveCachedRecommendations(userId, recommendations, profileSummary) {
  try {
    // Deactivate existing recommendations
    await knex('skill_recommendations')
      .where({ user_id: userId })
      .update({ is_active: false });
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS);
    
    // Insert new recommendations
    await knex('skill_recommendations').insert({
      user_id: userId,
      recommendations: JSON.stringify(recommendations),
      profile_summary: profileSummary,
      expires_at: expiresAt,
      is_active: true
    });
    
  } catch (error) {
    console.error('Error saving cached recommendations:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Generate personalized fallback skills based on profile data
 * @param {Object} profileData - User's profile data
 * @returns {Array<string>} Personalized skill recommendations
 */
function getPersonalizedFallbackSkills(profileData) {
  // Analyze profile to determine industry/role
  const profileText = buildProfileSummary(profileData).toLowerCase();
  
  // Industry-specific skill mappings
  const industrySkills = {
    marketing: ['Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Content Strategy', 'Social Media Marketing'],
    technology: ['JavaScript', 'Python', 'Cloud Computing', 'Database Management', 'Cybersecurity'],
    finance: ['Financial Analysis', 'Excel Advanced', 'Risk Management', 'QuickBooks', 'Investment Analysis'],
    healthcare: ['Medical Terminology', 'HIPAA Compliance', 'Patient Care', 'Clinical Documentation', 'Electronic Health Records'],
    education: ['Curriculum Development', 'Classroom Management', 'Educational Technology', 'Student Assessment', 'Learning Management Systems'],
    sales: ['CRM Systems', 'Sales Strategy', 'Negotiation', 'Lead Generation', 'Customer Relationship Management'],
    legal: ['Legal Research', 'Contract Analysis', 'Regulatory Compliance', 'Case Management', 'Legal Writing'],
    travel: ['Customer Service', 'Travel Planning', 'Booking Systems', 'Cultural Awareness', 'Destination Knowledge']
  };
  
  // Try to match industry keywords
  for (const [industry, skills] of Object.entries(industrySkills)) {
    if (profileText.includes(industry) || 
        profileText.includes(industry.slice(0, -1)) || // Remove 's' for plural
        (industry === 'technology' && (profileText.includes('tech') || profileText.includes('software') || profileText.includes('developer'))) ||
        (industry === 'travel' && (profileText.includes('agent') || profileText.includes('tourism'))) ||
        (industry === 'healthcare' && (profileText.includes('medical') || profileText.includes('nurse') || profileText.includes('doctor'))) ||
        (industry === 'education' && (profileText.includes('teacher') || profileText.includes('instructor') || profileText.includes('academic')))) {
      return [...skills].slice(0, 5);
    }
  }
  
  // Universal professional skills as ultimate fallback
  return ['Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Time Management'];
}

module.exports = {
  generateSkillRecommendations,
  getCachedRecommendations,
  getPersonalizedFallbackSkills
};