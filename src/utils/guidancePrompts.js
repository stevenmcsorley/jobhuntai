/**
 * Enhanced guidance prompts for better AI tutoring
 */

const SKILL_CATEGORIES = {
  frontend: {
    keywords: ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'typescript', 'ui', 'ux', 'responsive'],
    context: 'Focus on user interface development, user experience, browser compatibility, and modern web development practices.',
    resources: [
      'MDN Web Docs for web standards',
      'React documentation for React concepts',
      'CSS-Tricks for styling techniques',
      'Frontend Masters courses',
      'CodePen for practice projects'
    ]
  },
  backend: {
    keywords: ['node', 'express', 'api', 'server', 'database', 'auth', 'security', 'microservices'],
    context: 'Focus on server-side development, APIs, databases, security, and scalability.',
    resources: [
      'Node.js documentation',
      'Express.js guides',
      'Database-specific documentation',
      'API design best practices',
      'Backend development tutorials'
    ]
  },
  database: {
    keywords: ['sql', 'mongodb', 'postgresql', 'mysql', 'nosql', 'query', 'schema'],
    context: 'Focus on data modeling, query optimization, database design, and data management.',
    resources: [
      'Database-specific documentation',
      'SQL tutorial sites',
      'Database design patterns',
      'Query optimization guides',
      'Data modeling resources'
    ]
  },
  devops: {
    keywords: ['docker', 'kubernetes', 'aws', 'deployment', 'ci/cd', 'cloud', 'infrastructure'],
    context: 'Focus on deployment, infrastructure, automation, and operational excellence.',
    resources: [
      'Cloud platform documentation',
      'Docker and containerization guides',
      'CI/CD best practices',
      'Infrastructure as Code tutorials',
      'DevOps methodology guides'
    ]
  },
  algorithms: {
    keywords: ['algorithm', 'data structure', 'complexity', 'sorting', 'searching', 'graph', 'tree'],
    context: 'Focus on algorithmic thinking, data structures, and computational complexity.',
    resources: [
      'LeetCode for practice problems',
      'Algorithm visualization tools',
      'Computer science textbooks',
      'Competitive programming platforms',
      'Big O notation guides'
    ]
  }
};

/**
 * Detects skill category from topic name
 */
function detectSkillCategory(topic) {
  const topicLower = topic.toLowerCase();
  
  for (const [category, config] of Object.entries(SKILL_CATEGORIES)) {
    if (config.keywords.some(keyword => topicLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

/**
 * Generates enhanced guidance prompt based on skill category and mistakes
 */
function generateGuidancePrompt(topic, incorrectResults) {
  const category = detectSkillCategory(topic);
  const categoryConfig = SKILL_CATEGORIES[category];
  
  const mistakePatterns = analyzeMistakePatterns(incorrectResults);
  const difficultyLevel = inferDifficultyLevel(incorrectResults);
  
  let prompt = `You are an expert technical tutor and career coach specializing in ${category} development.

CONTEXT: The user is learning "${topic}" and has made ${incorrectResults.length} mistakes in their recent tests.

ANALYSIS REQUIRED:
1. Identify core conceptual gaps and misunderstandings
2. Detect knowledge prerequisites that may be missing
3. Suggest practical, hands-on learning approaches
4. Provide realistic time estimates for improvement
5. Recommend specific resources and practice projects

MISTAKE PATTERNS DETECTED:
${mistakePatterns.join('\n')}

DIFFICULTY LEVEL: ${difficultyLevel}
${categoryConfig ? `CATEGORY CONTEXT: ${categoryConfig.context}` : ''}

RESPONSE FORMAT: Return ONLY valid JSON with these keys:
{
  "summary_of_weaknesses": "Brief, specific summary of core issues (2-3 sentences)",
  "knowledge_gaps": ["List of prerequisite concepts that need review"],
  "learning_plan": [
    {
      "step": "Specific action to take",
      "timeEstimate": "Realistic time needed (e.g., '2-3 hours', '1 week')",
      "priority": "high|medium|low",
      "resources": ["Specific resources or tools to use"]
    }
  ],
  "practice_projects": [
    {
      "name": "Project name",
      "description": "What to build and why",
      "difficulty": "beginner|intermediate|advanced",
      "skills_practiced": ["Skills this project reinforces"]
    }
  ],
  "assessment_criteria": ["How to know when you've mastered this topic"],
  "estimated_mastery_time": "Realistic timeline for proficiency"
}

GUIDELINES:
- Be specific and actionable, not generic
- Focus on practical application over theory
- Suggest resources that match the user's level
- Include both short-term wins and long-term goals
- Consider real-world usage and best practices`;

  if (categoryConfig) {
    prompt += `\n\nRECOMMENDED RESOURCES FOR ${category.toUpperCase()}:\n${categoryConfig.resources.join('\n')}`;
  }

  return prompt;
}

/**
 * Analyzes patterns in user mistakes
 */
function analyzeMistakePatterns(incorrectResults) {
  const patterns = [];
  
  // Analyze answer patterns
  const emptyAnswers = incorrectResults.filter(r => !r.user_answer || r.user_answer.trim() === '').length;
  const shortAnswers = incorrectResults.filter(r => r.user_answer && r.user_answer.length < 20).length;
  
  if (emptyAnswers > incorrectResults.length * 0.3) {
    patterns.push(`• High rate of unanswered questions (${emptyAnswers}/${incorrectResults.length}) - may indicate knowledge gaps or time pressure`);
  }
  
  if (shortAnswers > incorrectResults.length * 0.4) {
    patterns.push(`• Many very brief answers - may indicate lack of confidence or insufficient detail`);
  }
  
  // Analyze question types
  const questionTypes = incorrectResults.map(r => {
    const question = r.question_text.toLowerCase();
    if (question.includes('what is') || question.includes('define')) return 'definition';
    if (question.includes('how') || question.includes('explain')) return 'explanation';
    if (question.includes('implement') || question.includes('write')) return 'implementation';
    if (question.includes('best practice') || question.includes('should')) return 'best_practice';
    return 'other';
  });
  
  const typeCount = questionTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const mostProblematicType = Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0];
  if (mostProblematicType && mostProblematicType[1] > 1) {
    patterns.push(`• Struggles most with ${mostProblematicType[0]} questions (${mostProblematicType[1]} incorrect)`);
  }
  
  return patterns.length > 0 ? patterns : ['• Mixed types of errors - comprehensive review needed'];
}

/**
 * Infers user's difficulty level from mistakes
 */
function inferDifficultyLevel(incorrectResults) {
  // Simple heuristic based on answer quality and question complexity
  const hasDetailedAnswers = incorrectResults.some(r => r.user_answer && r.user_answer.length > 100);
  const hasCodeAnswers = incorrectResults.some(r => r.user_answer && (r.user_answer.includes('function') || r.user_answer.includes('=>')));
  
  if (hasCodeAnswers && hasDetailedAnswers) {
    return 'Intermediate - Shows coding ability but has conceptual gaps';
  } else if (hasDetailedAnswers) {
    return 'Beginner to Intermediate - Good effort but needs foundational work';
  } else {
    return 'Beginner - Needs foundational concepts and practice';
  }
}

/**
 * Enhanced learning plan with time estimates and priorities
 */
function generateStructuredLearningPlan(topic, category, mistakes) {
  // This would be used by the AI prompt to structure responses consistently
  return {
    immediate: ['Quick wins that build confidence'],
    shortTerm: ['Skills to focus on in the next 1-2 weeks'],
    mediumTerm: ['Deeper concepts for the next month'],
    longTerm: ['Advanced skills for continued growth']
  };
}

module.exports = {
  SKILL_CATEGORIES,
  detectSkillCategory,
  generateGuidancePrompt,
  analyzeMistakePatterns,
  inferDifficultyLevel,
  generateStructuredLearningPlan
};