import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getDocumentStorageEnv } from '../config/storage-env.schema';
import type { DocumentStorageAdapter } from './types';

@Injectable()
export class RedisDocumentAdapter
  implements DocumentStorageAdapter, OnModuleDestroy
{
  private readonly redis: Redis;

  constructor() {
    const env = getDocumentStorageEnv();
    const password = env.REDIS_PASSWORD?.trim() || undefined;
    this.redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password,
      db: env.REDIS_DB,
      maxRetriesPerRequest: 2,
    });
  }

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ping(): Promise<void> {
    await this.redis.ping();
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  onModuleDestroy() {
    return this.close();
  }
}
