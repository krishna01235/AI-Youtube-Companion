const { GoogleGenAI } = require('@google/genai');
const genAI = new GoogleGenAI({
  vertexai: false, 
  apiKey: process.env.GEMINI_API_KEY
});

const generateSummary = async (transcript, options = {}) => {
  try {
    const { maxLength = 8000, model = 'gemini-2.0-flash-exp' } = options;
    let textToSummarize = transcript;
    if (transcript.length > maxLength) {
      textToSummarize = transcript.substring(0, maxLength) + '...';
    }
    
    const prompt = `Please create a comprehensive and well-structured summary of this YouTube video transcript.

Format your response in markdown with:
- A brief overview paragraph (2-3 sentences)
- **Key Points** section with bullet points of main topics
- **Important Insights** section highlighting key takeaways
- **Main Topics Covered** as a bulleted list

Keep the summary concise but informative, focusing on the most valuable content.

Transcript:
${textToSummarize}`;
    
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    const summary = response.text;
    
    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('Summary generated successfully');
    return summary;
    
  } catch (error) {
    console.error(' Gemini summary error:', error);
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid or missing Gemini API key');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded');
    } else if (error.message?.includes('SAFETY')) {
      throw new Error('Content blocked by safety filters');
    } else if (error.message?.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded, please try again later');
    }
    
    throw new Error(`Summary generation failed: ${error.message}`);
  }
};
const answerQuestion = async (transcript, question, options = {}) => {
  try {
    const { maxLength = 6000, model = 'gemini-2.0-flash-exp' } = options;
    let contextText = transcript;
    if (transcript.length > maxLength) {
      contextText = transcript.substring(0, maxLength) + '...';
    }
    
    const prompt = `Based on the following video transcript, please answer the user's question accurately and concisely.

Instructions:
- Answer only based on the information provided in the transcript
- If the answer is not in the transcript, say "This information is not covered in the video"
- Provide specific details when available
- Keep the answer focused and relevant to the question

Video Transcript:
${contextText}

User Question: ${question}

Answer:`;

    console.log('Answering question with Gemini...');
    
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    const answer = response.text;
    
    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('✅ Question answered successfully');
    return answer;
    
  } catch (error) {
    console.error('Gemini Q&A error:', error);
  
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid or missing Gemini API key');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded');
    } else if (error.message?.includes('SAFETY')) {
      throw new Error('Content blocked by safety filters');
    } else if (error.message?.includes('RATE_LIMIT')) {
      throw new Error('Rate limit exceeded, please try again later');
    }
    
    throw new Error(`Question answering failed: ${error.message}`);
  }
};

const testConnection = async () => {
  try {
    console.log('Testing Gemini connection');
    
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'Say "Hello from Gemini!" if you can read this.',
    });
    
    console.log('Gemini connection successful:', response.text);
    return true;
  } catch (error) {
    console.error('Gemini connection failed:', error.message);
    return false;
  }
};

module.exports = {
  generateSummary,
  answerQuestion,
  testConnection
};
