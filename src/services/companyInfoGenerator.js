const Groq = require('groq-sdk');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY in your .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function generateCompanyInfo(companyName) {
  console.log(`🤖 Generating company info for: ${companyName}`);
  try {
    const chat = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a business analyst. Your task is to provide a concise summary of a company based on its name. The summary should include its industry, primary products or services, and a brief overview of its market position or reputation. The output should be plain text, well-formatted for readability.`
        },
        {
          role: 'user',
          content: `Please provide a summary for the company: "${companyName}"`
        }
      ]
    });

    const companyInfoText = chat.choices[0].message.content || '';
    console.log(`✅ Company info generated for: ${companyName}`);
    return companyInfoText;

  } catch (err) {
    console.error(`❌ Groq error during company info generation: ${err.message}`);
    throw err;
  }
}

module.exports = { generateCompanyInfo };
