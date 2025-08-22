const Groq = require('groq-sdk');
const { validateQuestionParams, validateAIResponse, ValidationError } = require('../utils/validation');
const { retryWithBackoff, groqCircuitBreaker, performanceMonitor, GroqError } = require('../utils/errorHandler');
const { generateGuidancePrompt, SKILL_CATEGORIES } = require('../utils/guidancePrompts');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function generateGuidance(topic, incorrectResults) {
  const timer = performanceMonitor.startTimer('generateGuidance');
  console.log(`🤖 Generating enhanced guidance for topic: ${topic}`);
  
  if (!topic || typeof topic !== 'string') {
    throw new ValidationError('Topic is required and must be a string', 'topic');
  }
  
  if (!incorrectResults || !Array.isArray(incorrectResults)) {
    throw new ValidationError('Incorrect results must be an array', 'incorrectResults');
  }
  
  const formattedMistakes = incorrectResults.map((r, index) => 
    `${index + 1}. Question: ${r.question_text}\n   Your Answer: ${r.user_answer || 'No answer provided'}\n   Correct Answer: ${typeof r.correct_answer === 'string' ? r.correct_answer : JSON.stringify(r.correct_answer)}\n   Feedback: ${r.feedback || 'No feedback available'}`
  ).join('\n\n');

  try {
    const guidance = await groqCircuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        const prompt = generateGuidancePrompt(topic, incorrectResults);
        
        const chat = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: `ANALYZE THESE MISTAKES FOR "${topic}":\n\n${formattedMistakes}\n\nGenerate comprehensive guidance following the format specified.`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 2000
        });

        const content = chat.choices[0]?.message?.content;
        if (!content) {
          throw new GroqError('Empty response from AI service');
        }
        
        const parsed = JSON.parse(content);
        
        // Validate AI response
        const expectedFields = ['summary_of_weaknesses', 'learning_plan'];
        validateAIResponse(parsed, expectedFields);
        
        // Enhanced validation for learning plan structure
        if (!Array.isArray(parsed.learning_plan)) {
          throw new ValidationError('Learning plan must be an array');
        }
        
        return parsed;
      });
    });

    const duration = timer.end();
    console.log(`✅ Enhanced guidance generated for: ${topic} in ${duration}ms`);
    
    // Add metadata
    guidance.metadata = {
      generatedAt: new Date().toISOString(),
      mistakeCount: incorrectResults.length,
      category: detectSkillCategory(topic),
      processingTime: duration
    };
    
    return guidance;

  } catch (err) {
    timer.end();
    console.error(`❌ Error during guidance generation for ${topic}: ${err.message}`);
    
    if (err instanceof ValidationError || err instanceof GroqError) {
      throw err;
    }
    
    throw new GroqError(`Failed to generate guidance: ${err.message}`, err);
  }
}

/**
 * Analyzes learning progress over time
 */
async function analyzeProgressTrends(topic, knex, userId = null) {
  try {
    let query = knex('test_sessions')
      .where('skill', topic);
    
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    const recentSessions = await query
      .orderBy('completed_at', 'desc')
      .limit(10)
      .select('score', 'completed_at');
    
    if (recentSessions.length < 2) {
      return { trend: 'insufficient_data', sessions: recentSessions.length };
    }
    
    const scores = recentSessions.map(s => s.score).reverse(); // chronological order
    const trend = calculateTrend(scores);
    const improvement = scores[scores.length - 1] - scores[0];
    
    return {
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      improvement: Math.round(improvement),
      sessionCount: recentSessions.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      latestScore: scores[scores.length - 1]
    };
  } catch (err) {
    console.error('Error analyzing progress trends:', err);
    return { trend: 'error', error: err.message };
  }
}

/**
 * Calculates simple linear trend
 */
function calculateTrend(scores) {
  const n = scores.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = scores.reduce((a, b) => a + b, 0);
  const sumXY = scores.reduce((sum, score, index) => sum + score * index, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

/**
 * Generates personalized study schedule
 */
function generateStudySchedule(learningPlan, userLevel = 'intermediate') {
  const timeMultipliers = {
    beginner: 1.5,
    intermediate: 1.0,
    advanced: 0.8
  };
  
  const multiplier = timeMultipliers[userLevel] || 1.0;
  
  return learningPlan.map((step, index) => ({
    week: Math.floor(index / 3) + 1,
    day: (index % 3) + 1,
    task: step.step || step,
    estimatedHours: Math.ceil((step.timeEstimate || 2) * multiplier),
    priority: step.priority || 'medium'
  }));
}

/**
 * Detects skill category based on topic keywords
 */
function detectSkillCategory(topic) {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('javascript') || topicLower.includes('react') || topicLower.includes('node') || 
      topicLower.includes('python') || topicLower.includes('java') || topicLower.includes('programming') ||
      topicLower.includes('coding') || topicLower.includes('algorithm') || topicLower.includes('data structure')) {
    return 'technical';
  }
  
  if (topicLower.includes('interview') || topicLower.includes('communication') || topicLower.includes('leadership') ||
      topicLower.includes('teamwork') || topicLower.includes('presentation') || topicLower.includes('behavioral')) {
    return 'behavioral';
  }
  
  if (topicLower.includes('career') || topicLower.includes('resume') || topicLower.includes('networking') ||
      topicLower.includes('job search') || topicLower.includes('professional') || topicLower.includes('industry')) {
    return 'career';
  }
  
  return 'general';
}

module.exports = { 
  generateGuidance, 
  analyzeProgressTrends,
  generateStudySchedule,
  detectSkillCategory
};
