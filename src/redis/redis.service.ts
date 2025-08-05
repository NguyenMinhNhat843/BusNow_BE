import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cache: Cache,
  ) {}

  async setRedis(key: string, value: any, ttl: number): Promise<any> {
    console.log('[Redis SET]', key, value, ttl);
    return await this.cache.set(key, value, { ttl } as any);
  }

  async getRedis(key: string): Promise<any> {
    const val = await this.cache.get(key);
    console.log('[Redis GET]', key, '=>', val);
    return val;
  }

  async delRedis(key: string): Promise<void> {
    console.log('[Redis DEL]', key);
    await this.cache.del(key);
  }
}
