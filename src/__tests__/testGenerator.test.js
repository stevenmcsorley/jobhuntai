const { generateTestQuestions, evaluateAnswer, getPromptMatrix } = require('../services/testGenerator');

// Mock Groq SDK
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('Test Generator Service', () => {
  let mockGroq;
  
  beforeEach(() => {
    const Groq = require('groq-sdk');
    mockGroq = new Groq();
    jest.clearAllMocks();
  });

  describe('generateTestQuestions', () => {
    it('should generate multiple choice questions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              question: "What is React?",
              options: ["Library", "Framework", "Language", "Database"],
              answer: "Library"
            })
          }
        }]
      };
      
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);
      
      const questions = await generateTestQuestions('React', 'Junior', 'multiple_choice', 1);
      
      expect(questions).toHaveLength(1);
      expect(questions[0]).toHaveProperty('question');
      expect(questions[0]).toHaveProperty('options');
      expect(questions[0]).toHaveProperty('answer');
    });

    it('should generate short answer questions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              question: "Explain React hooks",
              answer: "React hooks are functions that let you use state and lifecycle features in functional components"
            })
          }
        }]
      };
      
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);
      
      const questions = await generateTestQuestions('React', 'Mid-Level', 'short_answer', 1);
      
      expect(questions).toHaveLength(1);
      expect(questions[0]).toHaveProperty('question');
      expect(questions[0]).toHaveProperty('answer');
    });

    it('should handle API errors gracefully', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(new Error('API Error'));
      
      await expect(generateTestQuestions('React', 'Senior', 'code_challenge', 1))
        .rejects.toThrow('API Error');
    });

    it('should validate test type', async () => {
      await expect(generateTestQuestions('React', 'Junior', 'invalid_type', 1))
        .rejects.toThrow('Invalid test type: invalid_type');
    });
  });

  describe('evaluateAnswer', () => {
    it('should evaluate answers correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              is_correct: true,
              feedback: "Correct! Well explained.",
              correct_answer: "React is a JavaScript library"
            })
          }
        }]
      };
      
      mockGroq.chat.completions.create.mockResolvedValue(mockResponse);
      
      const result = await evaluateAnswer(
        "What is React?",
        "React is a JavaScript library",
        "React is a library for building user interfaces"
      );
      
      expect(result).toHaveProperty('is_correct', true);
      expect(result).toHaveProperty('feedback');
    });

    it('should handle evaluation errors', async () => {
      mockGroq.chat.completions.create.mockRejectedValue(new Error('Evaluation failed'));
      
      await expect(evaluateAnswer("Question", "Correct", "User answer"))
        .rejects.toThrow('Evaluation failed');
    });
  });

  describe('getPromptMatrix', () => {
    it('should return prompt templates', () => {
      const prompts = getPromptMatrix();
      
      expect(prompts).toHaveProperty('multiple_choice');
      expect(prompts).toHaveProperty('short_answer');
      expect(prompts).toHaveProperty('code_challenge');
      expect(typeof prompts.multiple_choice).toBe('string');
    });
  });
});