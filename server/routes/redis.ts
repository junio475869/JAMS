import express from 'express';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Set value in Redis
router.post('/set', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    await redis.set(key, value);
    res.json({ success: true });
  } catch (error) {
    console.error('Redis set error:', error);
    res.status(500).json({ error: 'Failed to set value in Redis' });
  }
});

// Get value from Redis
router.get('/get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const value = await redis.get(key);
    res.json({ value });
  } catch (error) {
    console.error('Redis get error:', error);
    res.status(500).json({ error: 'Failed to get value from Redis' });
  }
});

export default router; 