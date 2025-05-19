import { Express } from 'express';
import { Server } from 'socket.io';
import { Redis } from 'redis';

export abstract class BaseMicroservice {
  protected app: Express;
  protected io: Server;
  protected redis: Redis;

  constructor(app: Express, io: Server, redis: Redis) {
    this.app = app;
    this.io = io;
    this.redis = redis;
  }

  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;

  protected async validateToken(token: string): Promise<boolean> {
    try {
      const isValid = await this.redis.get(`token:${token}`);
      return !!isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  protected async rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, window);
      }
      return current <= limit;
    } catch (error) {
      console.error('Rate limit error:', error);
      return false;
    }
  }

  protected async encryptData(data: any): Promise<string> {
    // TODO: Implement encryption
    return JSON.stringify(data);
  }

  protected async decryptData(encrypted: string): Promise<any> {
    // TODO: Implement decryption
    return JSON.parse(encrypted);
  }
} 