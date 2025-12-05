import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MayanService } from './mayan.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MayanService],
  exports: [MayanService],
})
export class MayanModule {}

