import { useState, useEffect } from 'react';
import { Interview } from '@/types/interview';
import { useRedis } from './useRedis';

export const useInterview = () => {
  const [interview, setInterview] = useState<Interview | null>(null);
  const { saveToRedis, getFromRedis } = useRedis();

  useEffect(() => {
    const loadInterview = async () => {
      const data = await getFromRedis('current_interview');
      if (data) {
        setInterview(JSON.parse(data));
      }
    };
    loadInterview();
  }, [getFromRedis]);

  const updateInterview = async (newInterview: Interview) => {
    setInterview(newInterview);
    await saveToRedis('current_interview', JSON.stringify(newInterview));
  };

  const clearInterview = async () => {
    setInterview(null);
    await saveToRedis('current_interview', '');
  };

  return {
    interview,
    updateInterview,
    clearInterview
  };
}; 