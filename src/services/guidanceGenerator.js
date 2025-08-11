const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function generateGuidance(topic, incorrectResults) {
  console.log(`🤖 Generating guidance for topic: ${topic}`);
  
  const formattedMistakes = incorrectResults.map(r => 
    `- Question: ${r.question_text}\n  - Your Answer: ${r.user_answer}\n  - Correct Answer: ${JSON.parse(r.correct_answer)}`
  ).join('\n');

  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert technical tutor and career coach.
            Your task is to analyze a user's incorrect answers for a specific technical topic.
            Based on their mistakes, you will identify their core weaknesses and create a concise, actionable learning plan to help them improve.
            Return ONLY valid JSON with the following keys:
            - "summary_of_weaknesses": A brief, high-level summary of the user's main conceptual misunderstandings.
            - "learning_plan": An array of concrete, actionable steps for the user to take. For example: ["Review the official documentation on X.", "Build a small project that does Y.", "Watch a tutorial on Z."]`
        },
        {
          role: 'user',
          content: `
            I have been taking tests on the topic of "${topic}". Here is a list of the questions I answered incorrectly, along with my answers and the correct answers:

            ${formattedMistakes}

            Please analyze my mistakes and provide a summary of my weaknesses and a recommended learning plan.
          `
        }
      ],
      response_format: { type: 'json_object' }
    });

    const guidance = JSON.parse(chat.choices[0].message.content || '{}');
    console.log(`✅ Guidance generated for: ${topic}`);
    return guidance;

  } catch (err) {
    console.error(`❌ Groq error during guidance generation: ${err.message}`);
    throw err;
  }
}

module.exports = { generateGuidance };
