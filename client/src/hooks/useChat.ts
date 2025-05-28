import { useState, useEffect } from 'react';
import { Message, ChatMessage } from '@/types/chat';
import { useRedis } from './useRedis';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { saveToRedis, getFromRedis } = useRedis();

  useEffect(() => {
    const loadChatHistory = async () => {
      const history = await getFromRedis('interview_chat_history');
      if (history) {
        setMessages(JSON.parse(history));
      }
    };
    loadChatHistory();
  }, [getFromRedis]);

  useEffect(() => {
    if (messages.length > 0) {
      saveToRedis('interview_chat_history', JSON.stringify(messages));
    }
  }, [messages, saveToRedis]);

  const addMessage = (message: Message) => {
    const chatMessage: ChatMessage = {
      ...message,
      speaker: message.role === 'candidate' ? 'You' : message.role === 'interviewer' ? 'Interviewer' : 'AI Assistant'
    };
    setMessages(prev => [...prev, chatMessage]);
  };

  const clearChat = () => {
    setMessages([]);
    saveToRedis('interview_chat_history', JSON.stringify([]));
  };

  return {
    messages,
    addMessage,
    clearChat
  };
}; 