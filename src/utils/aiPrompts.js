/**
 * Enhanced AI prompt templates with better reliability and consistency
 */

const IMPROVED_PROMPTS = {
  multiple_choice: `
You are a senior software engineer and technical interviewer creating high-quality multiple-choice questions.

TASK: Generate ONE multiple-choice question about {topic} for a {difficulty} level developer.

REQUIREMENTS:
- Question must be technically accurate and relevant to real-world scenarios
- Four distinct options with only ONE clearly correct answer
- Wrong options should be plausible but definitely incorrect
- Avoid trivial syntax questions; focus on concepts and best practices
- Use clear, professional language

RESPONSE FORMAT: Return ONLY valid JSON with exactly these keys:
{
  "question": "Clear, specific question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "The exact correct option from the array above"
}

QUALITY STANDARDS:
- {difficulty} level: Junior (basic concepts), Mid-Level (practical application), Senior (architecture/optimization)
- Question should test understanding, not memorization
- All options must be the same length/complexity level
`,

  short_answer: `
You are a technical interviewer assessing a candidate's conceptual understanding.

TASK: Create ONE short-answer question about {topic} for a {difficulty} level developer.

REQUIREMENTS:
- Question should require 2-4 sentences to answer properly
- Focus on "why" and "how" rather than just "what"
- Test practical understanding, not just definitions
- Should relate to real development scenarios

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "question": "Thoughtful question requiring explanation",
  "answer": "Comprehensive model answer (2-4 sentences)"
}

DIFFICULTY GUIDELINES:
- Junior: Basic concepts and definitions with simple examples
- Mid-Level: Practical application and trade-offs
- Senior: Architecture decisions, performance implications, best practices
`,

  code_challenge: `
You are a senior software engineer designing practical coding assessments.

TASK: Create ONE coding challenge about {topic} for a {difficulty} level developer.

REQUIREMENTS:
- Problem should be solvable in 5-15 minutes
- Test practical programming skills, not algorithmic puzzles
- Include clear input/output requirements
- Focus on {topic} specifically
- Provide a clean, efficient solution

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "question": "Complete problem description with examples and requirements",
  "answer": "Clean JavaScript function solution (no markdown, no code fences)"
}

DIFFICULTY LEVELS:
- Junior: Basic function implementation, simple logic
- Mid-Level: Multiple requirements, error handling, optimization
- Senior: Complex logic, edge cases, performance considerations

EXAMPLE STRUCTURE:
"Write a function that [specific task]. The function should [requirements]. Example: input X should return Y."
`,

  evaluation: `
You are a fair and constructive technical interviewer evaluating a candidate's answer.

EVALUATION CRITERIA:
1. Technical accuracy - Is the answer factually correct?
2. Completeness - Does it address all parts of the question?
3. Clarity - Is the explanation clear and well-structured?
4. Practical relevance - Does it show real-world understanding?

INSTRUCTIONS:
- Compare the user's answer against the model answer and question requirements
- Be fair but thorough in your assessment
- Provide specific, actionable feedback
- If the answer is partially correct, acknowledge what's right
- Suggest improvements without being harsh

RESPONSE FORMAT: Return ONLY valid JSON:
{
  "is_correct": boolean,
  "feedback": "Specific, constructive feedback explaining the evaluation",
  "correct_answer": "Verified correct answer if user was wrong"
}

Remember: Focus on understanding over perfect wording. A good answer might use different words but show correct understanding.
`
};

/**
 * Generates a context-aware prompt for question generation
 */
function generateQuestionPrompt(topic, difficulty, type) {
  const basePrompt = IMPROVED_PROMPTS[type];
  if (!basePrompt) {
    throw new Error(`Unknown prompt type: ${type}`);
  }

  // Add topic-specific guidance
  let topicGuidance = '';
  if (topic.toLowerCase().includes('react')) {
    topicGuidance = '\nFocus on React-specific concepts like hooks, components, state management, and lifecycle.';
  } else if (topic.toLowerCase().includes('javascript')) {
    topicGuidance = '\nFocus on JavaScript fundamentals, ES6+, async programming, and browser APIs.';
  } else if (topic.toLowerCase().includes('node')) {
    topicGuidance = '\nFocus on Node.js runtime, modules, async patterns, and backend concepts.';
  }

  return basePrompt
    .replace(/{topic}/g, topic)
    .replace(/{difficulty}/g, difficulty) + topicGuidance;
}

/**
 * Generates evaluation prompt with context
 */
function generateEvaluationPrompt(question, modelAnswer, userAnswer, type) {
  const basePrompt = IMPROVED_PROMPTS.evaluation;
  
  return `${basePrompt}

QUESTION: "${question}"
MODEL ANSWER: "${modelAnswer}"
USER'S ANSWER: "${userAnswer}"
TEST TYPE: ${type}

Evaluate the user's answer following the criteria above.`;
}

/**
 * Prompt templates for different skill categories
 */
const CATEGORY_PROMPTS = {
  frontend: {
    context: 'Focus on user interface, user experience, browser compatibility, and modern web development practices.',
    keywords: ['responsive design', 'accessibility', 'performance', 'browser APIs', 'CSS', 'HTML', 'frameworks']
  },
  backend: {
    context: 'Focus on server-side logic, databases, APIs, security, and scalability concerns.',
    keywords: ['APIs', 'databases', 'authentication', 'security', 'performance', 'scalability', 'microservices']
  },
  fullstack: {
    context: 'Cover both frontend and backend concepts, focusing on how they integrate.',
    keywords: ['REST APIs', 'authentication', 'deployment', 'architecture', 'data flow', 'integration']
  },
  database: {
    context: 'Focus on data modeling, query optimization, transactions, and database design patterns.',
    keywords: ['SQL', 'indexing', 'normalization', 'transactions', 'performance', 'relationships']
  },
  devops: {
    context: 'Focus on deployment, monitoring, automation, and infrastructure management.',
    keywords: ['CI/CD', 'deployment', 'monitoring', 'containerization', 'cloud', 'automation']
  }
};

/**
 * Detects category from topic and adds relevant context
 */
function addCategoryContext(prompt, topic) {
  const topicLower = topic.toLowerCase();
  
  for (const [category, config] of Object.entries(CATEGORY_PROMPTS)) {
    if (config.keywords.some(keyword => topicLower.includes(keyword))) {
      return `${prompt}\n\nCATEGORY CONTEXT: ${config.context}`;
    }
  }
  
  return prompt;
}

module.exports = {
  IMPROVED_PROMPTS,
  generateQuestionPrompt,
  generateEvaluationPrompt,
  addCategoryContext,
  CATEGORY_PROMPTS
};