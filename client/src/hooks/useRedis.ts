import { useCallback } from 'react';

interface RedisHook {
  saveToRedis: (key: string, value: string) => Promise<void>;
  getFromRedis: (key: string) => Promise<string | null>;
}

export const useRedis = (): RedisHook => {
  const saveToRedis = useCallback(async (key: string, value: string) => {
    try {
      const response = await fetch('/api/redis/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to Redis');
      }
    } catch (error) {
      console.error('Error saving to Redis:', error);
      throw error;
    }
  }, []);

  const getFromRedis = useCallback(async (key: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/redis/get/${key}`);
      
      if (!response.ok) {
        throw new Error('Failed to get from Redis');
      }

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Error getting from Redis:', error);
      return null;
    }
  }, []);

  return {
    saveToRedis,
    getFromRedis,
  };
}; 