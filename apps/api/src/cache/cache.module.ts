import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

import { CACHE_PORT } from './cache.port';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    CacheService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('REDIS_URI');
        const client = url
          ? createClient({ url })
          : createClient({
              url: `redis://${configService.get<string>('REDIS_HOST') || 'localhost'}:${
                configService.get<number>('REDIS_PORT') || 6379
              }`,
            });

        client.on('error', () => undefined);

        try {
          await client.connect();
        } catch {
          // Keep the API bootable when Redis is optional or temporarily unavailable.
        }

        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: CACHE_PORT,
      useExisting: CacheService,
    },
  ],
  exports: [CacheService, CACHE_PORT, 'REDIS_CLIENT'],
})
export class CacheModule {}
