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
    You are an expert assessment creator with deep knowledge across all domains - from practical skills like goat herding and carpentry, to executive leadership, to technical expertise, to creative arts, to any profession or skill imaginable.

    Your task: Generate a multiple-choice question to test someone's understanding of {topic} at a {difficulty} level.

    **Skill Intelligence Guidelines:**
    - Automatically detect the domain/field of {topic} (e.g., agriculture, technology, leadership, trades, arts, etc.)
    - Adapt your question style to match that domain's real-world application
    - For practical skills: Focus on hands-on scenarios, safety, tools, techniques
    - For leadership/business: Focus on decisions, strategy, people management
    - For technical skills: Focus on concepts, implementation, troubleshooting
    - For creative fields: Focus on principles, techniques, critique, process
    - For academic subjects: Focus on understanding, application, analysis

    **Difficulty Adaptation:**
    - Beginner: Basic concepts, common scenarios, fundamental knowledge
    - Intermediate: Complex scenarios, nuanced understanding, practical application
    - Advanced: Expert-level decisions, edge cases, mastery-level insights

    Create a realistic, practical question that someone in this field would actually encounter.
    Provide four distinct, plausible options where the wrong answers are realistic but incorrect.
    
    Return ONLY valid JSON with keys: "question", "options" (array of 4 strings), and "answer" (the correct string from options).
  `,
  short_answer: `
    You are an expert assessment creator with deep knowledge across all domains - from practical skills like goat herding and carpentry, to executive leadership, to technical expertise, to creative arts, to any profession or skill imaginable.

    Your task: Generate a short-answer question to test someone's conceptual understanding of {topic} at a {difficulty} level.

    **Skill Intelligence Guidelines:**
    - Automatically detect the domain/field of {topic} (e.g., agriculture, technology, leadership, trades, arts, etc.)
    - Adapt your question style to match that domain's real-world application
    - For practical skills: Ask about methods, safety, troubleshooting, best practices
    - For leadership/business: Ask about strategies, decision-making, team dynamics
    - For technical skills: Ask about concepts, implementation approaches, problem-solving
    - For creative fields: Ask about techniques, principles, artistic choices, process
    - For academic subjects: Ask about understanding, analysis, application

    **Difficulty Adaptation:**
    - Beginner: Fundamental concepts, basic "how" and "why" questions
    - Intermediate: Scenario-based questions requiring deeper understanding
    - Advanced: Complex situations requiring expert judgment and nuanced understanding

    Create a question that requires a thoughtful, concise answer (2-4 sentences).
    The question should test understanding, not just memorization.
    
    Return ONLY valid JSON with keys: "question" and "answer".
  `,
  code_challenge: `
    You are an expert assessment creator specializing in practical, hands-on challenges across all domains.

    Your task: Generate a practical challenge to test someone's applied skills in {topic} at a {difficulty} level.

    **Domain Detection & Adaptation:**
    - If {topic} is programming/technical: Create a coding problem with JavaScript solution
    - If {topic} is leadership/business: Create a management scenario requiring strategic thinking
    - If {topic} is practical/trades: Create a problem-solving scenario with step-by-step solution
    - If {topic} is creative: Create a project brief with approach/methodology
    - If {topic} is academic: Create an analysis or research challenge

    **For Technical/Programming Topics:**
    - Provide a clear problem description and optimal JavaScript solution
    - Answer field contains ONLY raw code, no markdown or formatting

    **For Non-Technical Topics:**
    - Provide a realistic challenge or scenario as a single descriptive string
    - Answer field contains a structured approach, methodology, or solution steps as a single string

    **Critical JSON Format Requirements:**
    - The response MUST be a simple flat JSON object with exactly 2 string fields
    - "question": A single string containing the full challenge description
    - "answer": A single string containing the solution approach (can include numbered steps or bullet points within the string)
    - Do NOT create nested objects, arrays, or complex structures
    - Do NOT include extra fields like "id", "title", "constraints", etc.

    **Difficulty Scaling:**
    - Beginner: Straightforward scenarios with clear solutions
    - Intermediate: Multi-step problems requiring planning and execution
    - Advanced: Complex challenges with multiple considerations and trade-offs

    Return ONLY valid JSON with keys: "question" and "answer" (both must be simple strings).
  `
};

async function generateTestQuestions(topic, difficulty, type = 'short_answer', count = 5, userProfession = null) {
  // Validate input parameters
  validateQuestionParams(topic, difficulty, type, count);

  if (type.startsWith('behavioral_')) {
    console.log(`🤖 Generating ${count} behavioral questions...`);
    const questions = Array.from({ length: count }, behavioralTestGenerator.generateBehavioralQuestion);
    console.log(`✅ ${questions.length} behavioral questions generated.`);
    return questions;
  }

  const timer = performanceMonitor.startTimer('generateTestQuestions');
  const contextualTopic = userProfession ? `${topic} in the context of ${userProfession}` : topic;
  console.log(`🤖 Generating ${count} test questions for: ${contextualTopic} (${difficulty})`);
  
  try {
    const promptTemplate = promptMatrix[type];
    if (!promptTemplate) {
      throw new ValidationError(`Invalid test type: ${type}`, 'type');
    }

    // Add professional context to the prompt if profession is provided
    let enhancedPrompt = promptTemplate.replace('{topic}', contextualTopic).replace('{difficulty}', difficulty);
    
    if (userProfession) {
      enhancedPrompt += `\n\n**Professional Context:**\nThis test is for a ${userProfession}. Frame all questions, scenarios, and examples within the context of their professional field. Ensure the questions are relevant to their career and industry-specific challenges they would face.\n`;
    }
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const questionData = await groqCircuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          const chat = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: enhancedPrompt },
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

  // Handle empty answers immediately
  if (!userAnswer || userAnswer.trim().length === 0) {
    console.log(`❌ Empty answer provided - marking as incorrect`);
    return {
      is_correct: false,
      feedback: "No answer was provided. Please provide a response to demonstrate your understanding of the topic."
    };
  }

  console.log(`🤖 Evaluating answer for: "${question}"`);
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a universally knowledgeable and fair evaluator with expertise across ALL domains - from practical skills like goat herding and carpentry, to executive leadership, to technical expertise, to creative arts, to any profession or skill imaginable.

            **Universal Evaluation Intelligence:**
            - Automatically detect the domain/field from the question context
            - Apply domain-appropriate evaluation criteria and standards
            - For practical skills: Evaluate based on safety, efficiency, real-world applicability
            - For leadership/business: Evaluate based on sound reasoning, people impact, strategic thinking
            - For technical skills: Evaluate based on accuracy, best practices, problem-solving approach
            - For creative fields: Evaluate based on understanding of principles, techniques, artistic merit
            - For academic subjects: Evaluate based on conceptual understanding, accuracy, depth of analysis

            **Evaluation Steps:**
            1.  **Check for Empty Answer:** If the user answer is empty, null, or contains only whitespace, immediately mark as incorrect (is_correct: false)
            2.  **Detect Domain:** Identify what field/domain this question belongs to
            3.  **Analyze Question:** Identify key requirements, constraints, and success criteria appropriate to that domain
            4.  **Evaluate User Answer:** Compare against domain-appropriate standards and question requirements
            5.  **Determine Correctness:** Consider if the answer demonstrates proper understanding and meets real-world standards for that field
            6.  **Provide Domain-Appropriate Feedback:** Give constructive feedback using terminology and standards relevant to that field
            7.  **Verify & Improve Model Answer:** Ensure the provided model answer meets professional standards for that domain

            **Fairness Principles:**
            - Accept multiple valid approaches when appropriate to the field
            - Value practical wisdom alongside theoretical knowledge
            - Consider cultural and regional variations in practices where relevant
            - Recognize that expertise can be demonstrated in different ways across domains

            Return ONLY valid JSON with three keys:
            - "is_correct": boolean (MUST be false for empty, null, or whitespace-only answers)
            - "feedback": string (domain-appropriate constructive feedback)
            - "correct_answer": string (verified, professional-standard answer for that field)
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
