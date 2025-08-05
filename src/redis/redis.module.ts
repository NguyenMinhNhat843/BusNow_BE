import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // nếu bạn muốn dùng ở mọi nơi không cần import lại
      store: redisStore,
      host: 'localhost', // hoặc lấy từ biến môi trường process.env.REDIS_HOST
      port: 6379, // tương tự như trên
      ttl: 300, // thời gian sống mặc định (5 phút)
    }),
  ],
  providers: [RedisService],
  exports: [RedisService], // để module khác có thể dùng
})
export class RedisModule {}
