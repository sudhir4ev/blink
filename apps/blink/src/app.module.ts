import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JanuModule } from '@lib/janu';

@Module({
  imports: [ConfigModule.forRoot(), JanuModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
