import { useState } from 'react';
import { useOpenAI } from './useOpenAI';
import { Message } from '@/types/chat';
import { AIResponse } from '@/types/ai';

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const { getAIResponse } = useOpenAI();

  const generateResponse = async (message: Message, messages: Message[], type: string) => {
    setIsProcessing(true);
    try {
      const response = await getAIResponse(message.content, messages);
      if (response) {
        const aiResponse: AIResponse = {
          content: response,
          type,
          timestamp: new Date().toISOString()
        };
        setAiResponses(prev => ({
          ...prev,
          [type]: response
        }));
        return aiResponse;
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsProcessing(false);
    }
    return null;
  };

  return {
    isProcessing,
    aiResponses,
    generateResponse
  };
}; 