const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

const commonBehavioralQuestions = [
  "Tell me about a time you had to work with a difficult colleague.",
  "Describe a time you had to learn a new technology quickly.",
  "Tell me about a time you disagreed with a manager or a technical lead.",
  "Describe a project you are particularly proud of and explain your role in it.",
  "Tell me about a time you failed or made a mistake at work.",
  "Describe a time you had to handle a tight deadline or high-pressure situation.",
  "How do you handle constructive criticism?",
  "Tell me about a time you had to persuade someone to see your point of view."
];

const frameworkPrompts = {
  'behavioral_star': {
    name: 'STAR',
    components: ['Situation', 'Task', 'Action', 'Result'],
    prompt: `You are an expert interview coach specializing in the STAR method (Situation, Task, Action, Result). Evaluate the user's answer, providing a score (0-100) and concise, constructive feedback for each of the four components. The final score should be the average of the four component scores.`
  },
  'behavioral_soar': {
    name: 'SOAR',
    components: ['Situation', 'Obstacle', 'Action', 'Result'],
    prompt: `You are an expert interview coach specializing in the SOAR method (Situation, Obstacle, Action, Result). Evaluate the user's answer, providing a score (0-100) and concise, constructive feedback for each of the four components. The final score should be the average of the four component scores.`
  }
};

function generateBehavioralQuestion() {
  const question = commonBehavioralQuestions[Math.floor(Math.random() * commonBehavioralQuestions.length)];
  return { question, answer: "N/A" }; 
}

async function evaluateBehavioralAnswer(question, userAnswer, framework) {
  console.log(`🤖 Evaluating ${framework} answer for: ${question}`);
  
  const frameworkInfo = frameworkPrompts[framework];
  if (!frameworkInfo) {
    throw new Error(`Invalid behavioral framework: ${framework}`);
  }

  const feedbackKeys = frameworkInfo.components.map(c => `${c.toLowerCase()}_feedback`);
  const jsonStructure = feedbackKeys.map(key => `"${key}": { "score": number, "feedback": "string" }`).join(',\n');

  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `${frameworkInfo.prompt}
            Return ONLY valid JSON with the following keys:
            ${jsonStructure},
            "overall_score": number (average of the component scores),
            "final_summary": "A brief, overall summary of the user's answer."`
        },
        {
          role: 'user',
          content: `
            Question: "${question}"
            User's Answer: "${userAnswer}"

            Please evaluate my answer using the ${frameworkInfo.name} method and provide structured feedback.
          `
        }
      ],
      response_format: { type: 'json_object' }
    });

    const evaluation = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ ${frameworkInfo.name} evaluation complete.`);
    return evaluation;

  } catch (err) {
    console.error(`❌ Groq error during ${frameworkInfo.name} evaluation: ${err.message}`);
    throw err;
  }
}

module.exports = { generateBehavioralQuestion, evaluateBehavioralAnswer };