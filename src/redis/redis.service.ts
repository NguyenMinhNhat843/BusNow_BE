import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cache: Cache,
  ) {}

  async setRedis(key: string, value: any, ttl: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async getRedis(key: string): Promise<any> {
    return await this.cache.get(key);
  }

  async delRedis(key: string): Promise<void> {
    await this.cache.del(key);
  }
}
