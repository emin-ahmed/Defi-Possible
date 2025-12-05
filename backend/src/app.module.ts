import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccessModule } from './modules/access/access.module';
import { MayanModule } from './modules/mayan/mayan.module';
import { AiModule } from './modules/ai/ai.module';
import { databaseConfig } from './config/database.config';
import { bullConfig } from './config/bull.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    BullModule.forRootAsync({
      useFactory: bullConfig,
    }),
    AuthModule,
    DocumentsModule,
    AccessModule,
    MayanModule,
    AiModule,
  ],
})
export class AppModule {}

