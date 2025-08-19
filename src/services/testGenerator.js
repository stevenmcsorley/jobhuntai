const Groq = require('groq-sdk');
const behavioralTestGenerator = require('./behavioralTestGenerator');
const { validateQuestionParams, validateAIResponse, ValidationError } = require('../utils/validation');
const { retryWithBackoff, groqCircuitBreaker, performanceMonitor, GroqError } = require('../utils/errorHandler');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

const promptMatrix = {
  multiple_choice: `
    You are a senior software engineer creating a technical quiz.
    Generate a multiple-choice question to test a candidate's understanding of {topic} at a {difficulty} level.
    Provide a clear question, four distinct options (one correct), and identify the correct answer.
    Return ONLY valid JSON with keys: "question", "options" (an array of 4 strings), and "answer" (the correct string from the options).
  `,
  short_answer: `
    You are a technical interviewer.
    Generate a short-answer question to test a candidate's conceptual understanding of {topic} at a {difficulty} level.
    The question should require a concise, text-based answer.
    Provide the question and a model correct answer.
    Return ONLY valid JSON with keys: "question" and "answer".
  `,
  code_challenge: `
    You are a senior software engineer conducting a technical interview.
    Generate a code challenge to test a candidate's practical application of {topic} at a {difficulty} level.
    Provide a clear problem description as a single string.
    Return ONLY valid JSON with keys: "question" (a string containing the full problem description) and "answer" (the optimal JavaScript function solution as a string).
    The "answer" field must contain ONLY the raw code, with no markdown formatting, code fences (like \x60\x60\x60), or block quotes (like """).
  `
};

async function generateTestQuestions(topic, difficulty, type = 'short_answer', count = 5) {
  // Validate input parameters
  validateQuestionParams(topic, difficulty, type, count);

  if (type.startsWith('behavioral_')) {
    console.log(`🤖 Generating ${count} behavioral questions...`);
    const questions = Array.from({ length: count }, behavioralTestGenerator.generateBehavioralQuestion);
    console.log(`✅ ${questions.length} behavioral questions generated.`);
    return questions;
  }

  const timer = performanceMonitor.startTimer('generateTestQuestions');
  console.log(`🤖 Generating ${count} test questions for: ${topic} (${difficulty})`);
  
  try {
    const promptTemplate = promptMatrix[type];
    if (!promptTemplate) {
      throw new ValidationError(`Invalid test type: ${type}`, 'type');
    }

    const prompt = promptTemplate.replace('{topic}', topic).replace('{difficulty}', difficulty);
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const questionData = await groqCircuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          const chat = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: 'Please generate one question.' }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000
          });
          
          const content = chat.choices[0]?.message?.content;
          if (!content) {
            throw new GroqError('Empty response from AI service');
          }
          
          const parsed = JSON.parse(content);
          
          // Validate AI response based on test type
          const expectedFields = type === 'multiple_choice' 
            ? ['question', 'options', 'answer']
            : ['question', 'answer'];
          validateAIResponse(parsed, expectedFields);
          
          return parsed;
        });
      });
      
      questions.push(questionData);
    }
    
    const duration = timer.end();
    console.log(`✅ ${questions.length} questions generated in ${duration}ms`);
    return questions;

  } catch (err) {
    timer.end();
    console.error(`❌ Error during question generation: ${err.message}`);
    
    if (err instanceof ValidationError || err instanceof GroqError) {
      throw err;
    }
    
    throw new GroqError(`Failed to generate test questions: ${err.message}`, err);
  }
}

async function evaluateAnswer(question, correctAnswer, userAnswer, type) {
  if (type && type.startsWith('behavioral_')) {
    return behavioralTestGenerator.evaluateBehavioralAnswer(question, userAnswer, type);
  }

  console.log(`🤖 Evaluating answer for: "${question}"`);
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a meticulous and fair technical interview evaluator. Your task is to evaluate a user's answer based on a provided question and a model answer.

            **Evaluation Steps:**
            1.  **Analyze the Question:** First, carefully re-read the original **Question** and identify all its key constraints (e.g., timeframes, specific technologies, locations, required formats, etc.).
            2.  **Analyze the User's Answer:** Compare the **User's Answer** against the constraints identified in the question.
            3.  **Determine Correctness:** Decide if the User's Answer is correct, partially correct, or incorrect. It is correct if it satisfies all key constraints, even if the wording differs from the Model Answer.
            4.  **Provide Feedback:** Write brief, constructive feedback explaining *why* the answer is correct or incorrect, referencing the specific constraints from the question.
            5.  **Verify the Model Answer:** **Crucially, you must also validate the provided Model Answer against the original question's constraints.**
            6.  **Construct Final Answer:** If the user is incorrect, provide a verified and accurate correct answer. If the provided Model Answer was also flawed, you MUST correct it to create a truly accurate response.

            Return ONLY valid JSON with three keys:
            - "is_correct": boolean
            - "feedback": string (your constructive feedback)
            - "correct_answer": string (the verified and truly correct answer, which will be shown to the user)
            `
        },
        {
          role: 'user',
          content: `
            Question: "${question}"
            Model Answer: "${correctAnswer}"
            User's Answer: "${userAnswer}"

            Please evaluate the user's answer following the steps precisely.
          `
        }
      ],
      response_format: { type: 'json_object' }
    });

    const rawResponse = chat.choices[0].message.content || '{}';
    const evaluation = JSON.parse(rawResponse);

    // We only need is_correct and feedback for the return value to the client-side logic
    // The 'correct_answer' from the AI is used in the test result display, but not here.
    console.log(`✅ Evaluation complete.`);
    return {
      is_correct: evaluation.is_correct,
      feedback: evaluation.feedback
    };

  } catch (err) {
    console.error(`❌ Groq error during answer evaluation: ${err.message}`);
    console.error(`Raw response was: ${rawResponse}`);
    throw err;
  }
}

function getPromptMatrix() {
  return promptMatrix;
}

module.exports = { generateTestQuestions, evaluateAnswer, getPromptMatrix };
