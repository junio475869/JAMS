import { useCallback } from 'react';

interface ChatMessage {
  speaker: 'interviewer' | 'candidate';
  content: string;
  timestamp: number;
}

interface OpenAIHook {
  getAIResponse: (transcript: string, chatHistory: ChatMessage[]) => Promise<string | null>;
}

export const useOpenAI = (): OpenAIHook => {
  const getAIResponse = useCallback(async (transcript: string, chatHistory: ChatMessage[]): Promise<string | null> => {
    try {
      const mockResponse = "This is a mock response";
      return mockResponse;
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          chatHistory,
          methods: ['STAR', 'CAR'], // Add more methods as needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return null;
    }
  }, []);

  return {
    getAIResponse,
  };
}; 