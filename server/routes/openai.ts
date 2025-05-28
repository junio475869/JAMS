import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  speaker: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
}

router.post('/chat', async (req, res) => {
  try {
    const { transcript, chatHistory, methods } = req.body;

    if (!transcript || !chatHistory || !methods) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a system message that includes the interview context and methods
    const systemMessage = {
      role: 'system',
      content: `You are an AI interview assistant. Analyze the candidate's response and provide feedback using the following methods:
      ${methods.join(', ')}.
      
      STAR Method:
      - Situation: Describe the situation or context
      - Task: Explain the task or challenge
      - Action: Detail the actions taken
      - Result: Share the outcomes or results
      
      CAR Method:
      - Context: Set the scene
      - Action: Describe what was done
      - Result: Explain the outcome
      
      Provide constructive feedback and suggestions for improvement.`
    };

    // Convert chat history to OpenAI message format
    const messages = [
      systemMessage,
      ...chatHistory.map((msg: ChatMessage) => ({
        role: msg.speaker === 'interviewer' ? 'assistant' : 'user',
        content: msg.content,
      })),
      {
        role: 'user',
        content: transcript,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || null;
    res.json({ response });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

export default router; 