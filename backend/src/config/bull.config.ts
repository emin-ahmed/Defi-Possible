import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export const bullConfig = (): BullModuleOptions => {
  const configService = new ConfigService();

  return {
    redis: {
      host: configService.get('REDIS_HOST', 'redis'),
      port: configService.get('REDIS_PORT', 6379),
    },
  };
};

