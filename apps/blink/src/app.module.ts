import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenAIModule } from '@repo/genai';

@Module({
  imports: [ConfigModule.forRoot(), GenAIModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
