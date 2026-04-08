import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JanuModule } from '@lib/janu';

@Module({
  imports: [JanuModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
