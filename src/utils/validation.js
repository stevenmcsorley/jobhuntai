/**
 * Validation utilities for the job hunt AI application
 */

const VALID_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_TEST_TYPES = ['multiple_choice', 'short_answer', 'code_challenge', 'behavioral_star', 'behavioral_soar'];
const MAX_SKILL_LENGTH = 100;
const MAX_ANSWER_LENGTH = 5000;

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates test configuration
 */
function validateTestConfig(config) {
  const errors = [];

  // Validate skill
  if (!config.skill || typeof config.skill !== 'string') {
    errors.push({ field: 'skill', message: 'Skill is required and must be a string' });
  } else if (config.skill.length > MAX_SKILL_LENGTH) {
    errors.push({ field: 'skill', message: `Skill must be less than ${MAX_SKILL_LENGTH} characters` });
  }

  // Validate difficulty (only for non-behavioral tests)
  if (!config.type || !config.type.startsWith('behavioral_')) {
    if (!config.difficulty || !VALID_DIFFICULTIES.includes(config.difficulty)) {
      errors.push({ 
        field: 'difficulty', 
        message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}` 
      });
    }
  }

  // Validate test type
  if (!config.type || !VALID_TEST_TYPES.includes(config.type)) {
    errors.push({ 
      field: 'type', 
      message: `Test type must be one of: ${VALID_TEST_TYPES.join(', ')}` 
    });
  }

  if (errors.length > 0) {
    const error = new ValidationError('Invalid test configuration');
    error.details = errors;
    throw error;
  }

  return true;
}

/**
 * Validates user answer input
 */
function validateAnswer(answer) {
  if (answer === null || answer === undefined) {
    throw new ValidationError('Answer cannot be null or undefined', 'answer');
  }

  if (typeof answer !== 'string') {
    throw new ValidationError('Answer must be a string', 'answer');
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    throw new ValidationError(`Answer must be less than ${MAX_ANSWER_LENGTH} characters`, 'answer');
  }

  return true;
}

/**
 * Validates question generation parameters
 */
function validateQuestionParams(topic, difficulty, type, count = 5) {
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new ValidationError('Topic is required and must be a non-empty string', 'topic');
  }

  if (!type.startsWith('behavioral_') && (!difficulty || !VALID_DIFFICULTIES.includes(difficulty))) {
    throw new ValidationError(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`, 'difficulty');
  }

  if (!VALID_TEST_TYPES.includes(type)) {
    throw new ValidationError(`Test type must be one of: ${VALID_TEST_TYPES.join(', ')}`, 'type');
  }

  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new ValidationError('Question count must be an integer between 1 and 20', 'count');
  }

  return true;
}

/**
 * Sanitizes user input to prevent injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove potentially dangerous characters and patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates AI response format
 */
function validateAIResponse(response, expectedFields = []) {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('AI response must be a valid object');
  }

  const missingFields = expectedFields.filter(field => !(field in response));
  if (missingFields.length > 0) {
    throw new ValidationError(`AI response missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
}

/**
 * Rate limiting validation
 */
function validateRateLimit(requests, timeWindow = 60000, maxRequests = 100) {
  const now = Date.now();
  const validRequests = requests.filter(timestamp => now - timestamp < timeWindow);
  
  if (validRequests.length >= maxRequests) {
    throw new ValidationError('Rate limit exceeded. Please try again later.');
  }
  
  return true;
}

module.exports = {
  ValidationError,
  validateTestConfig,
  validateAnswer,
  validateQuestionParams,
  sanitizeInput,
  validateAIResponse,
  validateRateLimit,
  VALID_DIFFICULTIES,
  VALID_TEST_TYPES
};