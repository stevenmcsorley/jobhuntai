const { generateGuidance, analyzeProgressTrends, detectSkillCategory } = require('../services/guidanceGenerator');

// Mock dependencies
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

jest.mock('../utils/errorHandler', () => ({
  retryWithBackoff: jest.fn((fn) => fn()),
  groqCircuitBreaker: {
    execute: jest.fn((fn) => fn())
  },
  performanceMonitor: {
    startTimer: jest.fn(() => ({ end: jest.fn(() => 100) }))
  },
  GroqError: class GroqError extends Error {
    constructor(message) {
      super(message);
      this.name = 'GroqError';
    }
  }
}));

jest.mock('../utils/validation', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message, field) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
  },
  validateAIResponse: jest.fn()
}));

jest.mock('../utils/guidancePrompts', () => ({
  generateGuidancePrompt: jest.fn(() => 'Mock prompt'),
  detectSkillCategory: jest.fn(() => 'frontend')
}));

describe('Guidance Generator Service', () => {
  let mockGroq;
  
  beforeEach(() => {
    const Groq = require('groq-sdk');
    mockGroq = new Groq();
    jest.clearAllMocks();
  });

  describe('generateGuidance', () => {
    const mockIncorrectResults = [
      {
        question_text: 'What is React?',
        user_answer: 'A framework',
        correct_answer: 'A library',
        feedback: 'React is a library, not a framework'
      }
    ];

    it('should generate enhanced guidance successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary_of_weaknesses: 'Confusion between library and framework concepts',
              learning_plan: [{
                step: 'Review React documentation',
                timeEstimate: '2 hours',
                priority: 'high',
                resources: ['React docs']
              }],
              knowledge_gaps: ['Library vs Framework'],
              practice_projects: [{
                name: 'Simple React App',
                description: 'Build a basic component',
                difficulty: 'beginner',
                skills_practiced: ['Components', 'JSX']
              }],
              assessment_criteria: ['Can explain React concepts clearly'],
              estimated_mastery_time: '1 week'
            })
          }
        }]
      };
      
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await generateGuidance('React', mockIncorrectResults);
      
      expect(result).toHaveProperty('summary_of_weaknesses');
      expect(result).toHaveProperty('learning_plan');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('generatedAt');
      expect(result.metadata).toHaveProperty('mistakeCount', 1);
      expect(result.metadata).toHaveProperty('category');
    });

    it('should validate input parameters', async () => {
      await expect(generateGuidance(null, mockIncorrectResults))
        .rejects.toThrow('Topic is required and must be a string');
        
      await expect(generateGuidance('React', null))
        .rejects.toThrow('Incorrect results must be an array');
    });

    it('should handle empty AI response', async () => {
      const mockResponse = {
        choices: [{ message: { content: null } }]
      };
      
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);
      
      await expect(generateGuidance('React', mockIncorrectResults))
        .rejects.toThrow('Empty response from AI service');
    });
  });

  describe('analyzeProgressTrends', () => {
    const mockKnex = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn()
    };

    it('should analyze improving trend', async () => {
      const mockSessions = [
        { score: 60, completed_at: '2023-01-01' },
        { score: 70, completed_at: '2023-01-02' },
        { score: 80, completed_at: '2023-01-03' }
      ];
      
      mockKnex.select.mockResolvedValue(mockSessions);
      
      const result = await analyzeProgressTrends('React', mockKnex);
      
      expect(result).toHaveProperty('trend', 'improving');
      expect(result).toHaveProperty('improvement', 20);
      expect(result).toHaveProperty('sessionCount', 3);
      expect(result).toHaveProperty('averageScore', 70);
    });

    it('should handle insufficient data', async () => {
      mockKnex.select.mockResolvedValue([{ score: 80 }]);
      
      const result = await analyzeProgressTrends('React', mockKnex);
      
      expect(result).toHaveProperty('trend', 'insufficient_data');
      expect(result).toHaveProperty('sessions', 1);
    });

    it('should handle database errors', async () => {
      mockKnex.select.mockRejectedValue(new Error('Database error'));
      
      const result = await analyzeProgressTrends('React', mockKnex);
      
      expect(result).toHaveProperty('trend', 'error');
      expect(result).toHaveProperty('error', 'Database error');
    });
  });

  describe('detectSkillCategory', () => {
    it('should detect frontend skills', () => {
      const result = detectSkillCategory('React');
      expect(result).toBe('frontend');
    });

    it('should detect backend skills', () => {
      const result = detectSkillCategory('Node.js');
      expect(result).toBe('backend');
    });

    it('should default to general for unknown skills', () => {
      const result = detectSkillCategory('Unknown Technology');
      expect(result).toBe('general');
    });
  });
});